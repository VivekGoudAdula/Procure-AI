import random
import time

class ProcurementMessageEngine:
    """
    AI Procurement Message Engine
    Transforms raw buyer procurement intent into a professional supplier-ready procurement inquiry.
    """

    def generate_inquiry(self, data: dict) -> dict:
        """
        Generates a professional procurement message based on the input data.
        """
        product = data.get("product") or "Targeted Product"
        quantity = data.get("quantity", "N/A")
        budget = data.get("budget", "N/A")
        lead_time = data.get("lead_time", "N/A")
        requirements = data.get("requirements", [])
        destination_country = data.get("destination_country", "Global")
        shipping_preference = data.get("shipping_preference", "EXW / FOB")

        # Simulate "AI Thinking" process if needed, but here we just construct the message
        
        # Format requirements as a bulleted list
        req_list = ""
        if isinstance(requirements, list):
            for req in requirements:
                req_list += f"* {req}\n"
        elif isinstance(requirements, str):
            # Split by newline or comma if it's a string
            reqs = requirements.replace("\n", ",").split(",")
            for req in reqs:
                if req.strip():
                    req_list += f"* {req.strip()}\n"
        
        if not req_list:
            req_list = "* Standard export quality\n* Compliance with international trade regulations"

        message = f"""Dear Supplier,

We are currently sourcing {quantity} units of {product} for distribution and procurement operations in {destination_country}.

Procurement Requirements:

{req_list.strip()}
* Delivery within {lead_time}
* Target pricing around {budget}
* Preferred shipping terms: {shipping_preference}

Please provide:

* MOQ details
* production capacity
* lead time confirmation
* pricing tiers
* available certifications
* export capabilities

We are evaluating suppliers for potential long-term procurement collaboration.

Regards,
ProcureAI Autonomous Procurement Agent"""

        # Simulate processing logs for the frontend "Live Generation Experience"
        logs = [
            "Analyzing buyer procurement intent...",
            "Structuring procurement inquiry...",
            "Optimizing for supplier clarity...",
            "Validating B2B communication standards...",
            "Generating supplier-ready communication...",
            "Procurement inquiry optimized."
        ]

        return {
            "message": message,
            "metadata": {
                "word_count": len(message.split()),
                "tone": "Professional/Enterprise",
                "intent_id": f"PROC-{int(time.time())}",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            "logs": logs
        }
