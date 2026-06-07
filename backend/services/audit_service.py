"""
ProcureAI Audit Service

This module provides comprehensive audit logging for all platform activities.
Every procurement event, AI recommendation, escrow activity, communication event,
and supplier interaction is stored in an immutable audit history.

This supports transparency, enterprise compliance, supplier accountability,
and future regulatory requirements.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid
from database.db import audit_logs_collection


def log_event(
    user_id: str,
    user_email: str,
    action: str,
    module: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> str:
    """
    Log an audit event to the audit_logs collection.
    
    Args:
        user_id: The ID of the user performing the action
        user_email: The email of the user performing the action
        action: The action performed (e.g., "LOGIN", "SUPPLIER_SELECTED", "ESCROW_CREATED")
        module: The module where the action occurred (e.g., "Authentication", "Procurement", "Escrow")
        entity_type: The type of entity affected (e.g., "user", "supplier", "escrow")
        entity_id: The ID of the entity affected
        details: Additional details about the action
        ip_address: The IP address of the user (optional)
    
    Returns:
        The ID of the inserted audit log document
    """
    if details is None:
        details = {}
    
    audit_log = {
        "log_id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_email": user_email,
        "action": action,
        "module": module,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc)
    }
    
    result = audit_logs_collection.insert_one(audit_log)
    print(f"[Audit Service] Logged event: {action} in {module} by {user_email}")
    return str(result.inserted_id)


def get_audit_logs(
    limit: int = 100,
    skip: int = 0,
    user_id: Optional[str] = None,
    module: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> list:
    """
    Retrieve audit logs with optional filtering.
    
    Args:
        limit: Maximum number of logs to return
        skip: Number of logs to skip (for pagination)
        user_id: Filter by user ID
        module: Filter by module
        action: Filter by action
        start_date: Filter logs after this date
        end_date: Filter logs before this date
    
    Returns:
        List of audit log documents
    """
    query = {}
    
    if user_id:
        query["user_id"] = user_id
    if module:
        query["module"] = module
    if action:
        query["action"] = action
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date
    
    logs = list(
        audit_logs_collection
        .find(query)
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Convert ObjectId to string for JSON serialization
    for log in logs:
        log["_id"] = str(log["_id"])
        if "timestamp" in log:
            log["timestamp"] = log["timestamp"].isoformat()
    
    return logs


def get_audit_stats() -> Dict[str, Any]:
    """
    Get comprehensive statistics about audit logs for the admin dashboard.
    Includes payment tracking, supplier sourcing, and escrow metrics.
    
    Returns:
        Dictionary containing comprehensive audit log statistics
    """
    try:
        total_logs = audit_logs_collection.count_documents({})
    except Exception as e:
        print(f"[Audit Service] Error counting total logs: {e}")
        total_logs = 0
    
    # Count logs by module
    module_counts = {}
    modules = ["Authentication", "Procurement", "Escrow", "AI", "Ratings", "Chat"]
    for module in modules:
        try:
            count = audit_logs_collection.count_documents({"module": module})
            module_counts[module.lower()] = count
        except Exception as e:
            print(f"[Audit Service] Error counting logs for module {module}: {e}")
            module_counts[module.lower()] = 0
    
    # Get recent activity (last 7 days)
    try:
        from datetime import timedelta
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_logs = audit_logs_collection.count_documents({
            "timestamp": {"$gte": seven_days_ago}
        })
    except Exception as e:
        print(f"[Audit Service] Error counting recent logs: {e}")
        recent_logs = 0
    
    # Payment and Escrow Metrics
    payment_stats = {
        "total_escrows_created": 0,
        "total_escrows_released": 0,
        "total_escrows_verified": 0,
        "total_escrows_in_progress": 0,
        "total_payment_amount": 0,
        "failed_transactions": 0
    }
    
    try:
        # Count escrow events
        payment_stats["total_escrows_created"] = audit_logs_collection.count_documents({
            "action": "ESCROW_CREATED"
        })
        payment_stats["total_escrows_released"] = audit_logs_collection.count_documents({
            "action": "ESCROW_RELEASED"
        })
        payment_stats["total_escrows_verified"] = audit_logs_collection.count_documents({
            "action": "ESCROW_VERIFIED"
        })
        
        # Calculate escrows in progress (created but not released)
        created_ids = set(log.get("entity_id") for log in audit_logs_collection.find(
            {"action": "ESCROW_CREATED"}, {"entity_id": 1}
        ))
        released_ids = set(log.get("entity_id") for log in audit_logs_collection.find(
            {"action": "ESCROW_RELEASED"}, {"entity_id": 1}
        ))
        payment_stats["total_escrows_in_progress"] = len(created_ids - released_ids)
        
        # Sum total payment amounts from escrow creations
        escrow_logs = audit_logs_collection.find({"action": "ESCROW_CREATED"}, {"details": 1})
        for log in escrow_logs:
            amount = log.get("details", {}).get("amount", 0)
            if amount:
                payment_stats["total_payment_amount"] += amount
        
        # Count failed transactions (if logged)
        payment_stats["failed_transactions"] = audit_logs_collection.count_documents({
            "action": {"$regex": "FAILED", "$options": "i"}
        })
    except Exception as e:
        print(f"[Audit Service] Error calculating payment stats: {e}")
    
    # Supplier Sourcing Metrics
    supplier_stats = {
        "total_suppliers_selected": 0,
        "unique_suppliers": set(),
        "total_procurement_value": 0
    }
    
    try:
        supplier_logs = audit_logs_collection.find({"action": "SUPPLIER_SELECTED"}, {"details": 1})
        for log in supplier_logs:
            supplier_stats["total_suppliers_selected"] += 1
            details = log.get("details", {})
            supplier_id = details.get("supplier_id") or details.get("entity_id")
            if supplier_id:
                supplier_stats["unique_suppliers"].add(supplier_id)
            final_price = details.get("final_price", 0)
            if final_price:
                supplier_stats["total_procurement_value"] += final_price
    except Exception as e:
        print(f"[Audit Service] Error calculating supplier stats: {e}")
    
    return {
        "total_audit_logs": total_logs,
        "module_counts": module_counts,
        "recent_activity": recent_logs,
        "payment_stats": payment_stats,
        "supplier_stats": {
            "total_suppliers_selected": supplier_stats["total_suppliers_selected"],
            "unique_suppliers_count": len(supplier_stats["unique_suppliers"]),
            "total_procurement_value": supplier_stats["total_procurement_value"]
        }
    }
