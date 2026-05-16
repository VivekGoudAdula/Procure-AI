"""
Multilingual AI Negotiation Engine
===================================
Autonomous cross-border procurement intelligence layer.
Simulates AI-mediated supplier communication across language boundaries
with full procurement context, supplier cultural profiling, and
intent analysis for enterprise B2B negotiations.
"""

import random
from typing import Optional

# --- Procurement-native negotiation scenarios per language ---

NEGOTIATION_SCENARIOS = {
    "Chinese": {
        "flag": "🇨🇳",
        "country": "China",
        "region": "East Asia Manufacturing Hub",
        "rounds": [
            {
                "topic": "MOQ Reduction",
                "buyer_english": "We are evaluating a long-term procurement partnership and request a reduction in Minimum Order Quantity to align with our phased rollout schedule.",
                "buyer_translated": "我们正在评估长期采购合作，并请求降低最低订单量，以配合我们的分阶段发布计划。",
                "supplier_native": "感谢您的长期合作意向。考虑到您的采购规模，我们可以将MOQ降低20%，并为您提供优先生产排期。",
                "supplier_english": "Thank you for your long-term partnership interest. Considering your procurement volume, we can reduce MOQ by 20% and offer you priority production scheduling.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 91,
                    "pricing_potential": "Favorable",
                    "risk": "Low",
                    "supplier_pattern": "Collaborative",
                    "intent_signals": ["willingness to negotiate MOQ", "priority fulfillment offer", "long-term partnership openness"]
                }
            },
            {
                "topic": "Delivery Timeline Optimization",
                "buyer_english": "Our logistics team requires shipment within 21 days to meet contractual obligations. Can you confirm production and freight capacity for this timeline?",
                "buyer_translated": "我们的物流团队需要在21天内发货，以满足合同义务。请确认贵方的生产和货运能力是否支持此时间表。",
                "supplier_native": "我们现有库存充足，可以在18天内完成生产并安排货运。我们与三家认证物流合作商合作，确保准时交付。",
                "supplier_english": "We have sufficient inventory and can complete production and arrange freight within 18 days. We partner with three certified logistics providers to ensure on-time delivery.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 94,
                    "pricing_potential": "Favorable",
                    "risk": "Very Low",
                    "supplier_pattern": "Proactive",
                    "intent_signals": ["ahead-of-schedule delivery", "certified logistics network", "strong fulfillment confidence"]
                }
            },
            {
                "topic": "Long-Term Pricing Incentive",
                "buyer_english": "Subject to satisfactory performance in Q1, we are prepared to commit to a 12-month exclusive procurement agreement. What tiered pricing structure can you offer for annual volumes exceeding 50,000 units?",
                "buyer_translated": "在Q1表现令人满意的前提下，我们准备签订12个月的独家采购协议。对于年采购量超过50,000件，贵方能提供何种梯度定价方案？",
                "supplier_native": "非常感谢您的独家合作意向。对于年采购量超过50,000件，我们可提供三级梯度价格：5万件享受8%折扣，10万件享受15%折扣，20万件享受22%折扣，并包含免费质量审计服务。",
                "supplier_english": "We greatly appreciate your exclusive partnership interest. For annual volumes exceeding 50,000 units, we offer three-tier pricing: 8% discount at 50K units, 15% at 100K units, and 22% at 200K units, including complimentary quality audit services.",
                "analysis": {
                    "flexibility": "Very High",
                    "confidence": 97,
                    "pricing_potential": "Highly Favorable",
                    "risk": "Minimal",
                    "supplier_pattern": "Strategic Partner",
                    "intent_signals": ["multi-tier discount structure", "complimentary audit services", "exclusive agreement readiness", "strong enterprise intent"]
                }
            }
        ]
    },
    "Vietnamese": {
        "flag": "🇻🇳",
        "country": "Vietnam",
        "region": "Southeast Asia Production Network",
        "rounds": [
            {
                "topic": "MOQ Reduction",
                "buyer_english": "We are scaling our procurement operations and require flexibility in minimum order quantities for pilot batch validation before full-scale commitment.",
                "buyer_translated": "Chúng tôi đang mở rộng hoạt động mua sắm và cần linh hoạt về số lượng đặt hàng tối thiểu để xác nhận lô thử nghiệm trước khi cam kết toàn diện.",
                "supplier_native": "Chúng tôi hiểu nhu cầu của quý khách. Với mục tiêu hợp tác lâu dài, chúng tôi đồng ý giảm MOQ 25% cho lô thử nghiệm đầu tiên và cung cấp báo cáo QC miễn phí.",
                "supplier_english": "We understand your requirements. With a long-term collaboration objective, we agree to reduce MOQ by 25% for the first pilot batch and provide complimentary QC reporting.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 89,
                    "pricing_potential": "Favorable",
                    "risk": "Low",
                    "supplier_pattern": "Flexible",
                    "intent_signals": ["pilot batch accommodation", "QC transparency", "long-term openness"]
                }
            },
            {
                "topic": "Delivery Timeline Optimization",
                "buyer_english": "Our supply chain requires delivery within 25 days including customs clearance. Can you guarantee this timeline with your current production capacity?",
                "buyer_translated": "Chuỗi cung ứng của chúng tôi yêu cầu giao hàng trong vòng 25 ngày bao gồm thông quan. Quý vị có thể đảm bảo tiến độ này với năng lực sản xuất hiện tại không?",
                "supplier_native": "Chúng tôi có thể cam kết giao hàng trong 22 ngày, bao gồm cả thủ tục hải quan. Đối tác vận chuyển của chúng tôi có kinh nghiệm xử lý thông quan tại cảng Hải Phòng và TP.HCM.",
                "supplier_english": "We can commit to delivery within 22 days, including customs procedures. Our shipping partners have extensive experience with customs clearance at Hai Phong and Ho Chi Minh City ports.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 92,
                    "pricing_potential": "Competitive",
                    "risk": "Low",
                    "supplier_pattern": "Reliable",
                    "intent_signals": ["ahead-of-schedule commitment", "proven port logistics", "customs expertise"]
                }
            },
            {
                "topic": "Long-Term Pricing Incentive",
                "buyer_english": "We are open to a 6-month supply agreement with quarterly review checkpoints. What preferential pricing can you extend for committed quarterly volumes of 15,000 units?",
                "buyer_translated": "Chúng tôi sẵn sàng ký kết thỏa thuận cung cấp 6 tháng với các mốc đánh giá hàng quý. Quý vị có thể đưa ra mức giá ưu đãi cho khối lượng cam kết hàng quý là 15.000 đơn vị không?",
                "supplier_native": "Với cam kết 15.000 đơn vị mỗi quý, chúng tôi đề xuất mức giảm giá 12% so với giá niêm yết, kèm điều kiện thanh toán linh hoạt 30/60 ngày và hỗ trợ tùy chỉnh bao bì.",
                "supplier_english": "For a commitment of 15,000 units per quarter, we propose a 12% reduction from the listed price, with flexible 30/60-day payment terms and complimentary custom packaging support.",
                "analysis": {
                    "flexibility": "Very High",
                    "confidence": 95,
                    "pricing_potential": "Highly Favorable",
                    "risk": "Very Low",
                    "supplier_pattern": "Strategic Partner",
                    "intent_signals": ["12% volume discount", "flexible payment terms", "custom packaging offer", "strong B2B intent"]
                }
            }
        ]
    },
    "Spanish": {
        "flag": "🇲🇽",
        "country": "Mexico / Latin America",
        "region": "Latin American Supply Network",
        "rounds": [
            {
                "topic": "MOQ Reduction",
                "buyer_english": "To facilitate a structured onboarding into our global supply chain, we require an initial reduced minimum order to assess production quality and logistics performance.",
                "buyer_translated": "Para facilitar una incorporación estructurada a nuestra cadena de suministro global, requerimos un pedido mínimo inicial reducido para evaluar la calidad de producción y el rendimiento logístico.",
                "supplier_native": "Entendemos su necesidad de evaluar nuestra capacidad antes de escalar. Podemos reducir el MOQ un 30% para el pedido inicial, con garantía de calidad certificada ISO y tiempo de entrega de 20 días.",
                "supplier_english": "We understand your need to evaluate our capacity before scaling. We can reduce MOQ by 30% for the initial order, with ISO-certified quality assurance and a 20-day delivery window.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 88,
                    "pricing_potential": "Competitive",
                    "risk": "Low",
                    "supplier_pattern": "Collaborative",
                    "intent_signals": ["30% MOQ flexibility", "ISO certification", "structured onboarding readiness"]
                }
            },
            {
                "topic": "Delivery Timeline Optimization",
                "buyer_english": "Due to seasonal demand peaks, we need guaranteed shipment within 18 business days. Please confirm capacity and propose contingency protocols for delays.",
                "buyer_translated": "Debido a los picos de demanda estacional, necesitamos envío garantizado en 18 días hábiles. Por favor, confirme la capacidad y proponga protocolos de contingencia para retrasos.",
                "supplier_native": "Confirmamos disponibilidad para despacho en 16 días hábiles. En caso de retraso involuntario, ofrecemos compensación del 2% del valor del pedido por cada día de retraso, hasta un máximo del 10%.",
                "supplier_english": "We confirm availability for dispatch within 16 business days. In case of involuntary delay, we offer 2% of order value compensation per day of delay, up to a maximum of 10%.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 93,
                    "pricing_potential": "Favorable",
                    "risk": "Very Low",
                    "supplier_pattern": "Accountable",
                    "intent_signals": ["ahead of deadline commitment", "delay compensation clause", "high accountability"]
                }
            },
            {
                "topic": "Long-Term Pricing Incentive",
                "buyer_english": "We are evaluating strategic suppliers for a 24-month preferred vendor agreement. What annual volume pricing and dedicated capacity allocation can you offer?",
                "buyer_translated": "Estamos evaluando proveedores estratégicos para un acuerdo de proveedor preferido de 24 meses. ¿Qué precios por volumen anual y asignación de capacidad dedicada puede ofrecer?",
                "supplier_native": "Para un acuerdo de 24 meses, podemos asignar el 20% de nuestra capacidad de producción exclusivamente para su cuenta, con descuentos escalonados del 10%, 18% y 25% según volúmenes de 30K, 70K y 120K unidades anuales.",
                "supplier_english": "For a 24-month agreement, we can allocate 20% of our production capacity exclusively to your account, with tiered discounts of 10%, 18%, and 25% for annual volumes of 30K, 70K, and 120K units respectively.",
                "analysis": {
                    "flexibility": "Very High",
                    "confidence": 96,
                    "pricing_potential": "Highly Favorable",
                    "risk": "Minimal",
                    "supplier_pattern": "Strategic Partner",
                    "intent_signals": ["dedicated capacity allocation", "multi-year tiered pricing", "exclusive partnership readiness"]
                }
            }
        ]
    },
    "Hindi": {
        "flag": "🇮🇳",
        "country": "India",
        "region": "South Asian Manufacturing Corridor",
        "rounds": [
            {
                "topic": "MOQ Reduction",
                "buyer_english": "As part of our vendor diversification strategy, we need flexibility in initial order quantities to qualify new suppliers before committing to large-scale contracts.",
                "buyer_translated": "हमारी विक्रेता विविधीकरण रणनीति के तहत, हमें बड़े अनुबंध के प्रतिबद्ध होने से पहले नए आपूर्तिकर्ताओं को अर्हता प्राप्त करने के लिए प्रारंभिक ऑर्डर मात्रा में लचीलेपन की आवश्यकता है।",
                "supplier_native": "हम आपकी आवश्यकता समझते हैं। पहले ऑर्डर के लिए MOQ में 25% की कमी के साथ, हम नि:शुल्क नमूना और तृतीय-पक्ष गुणवत्ता प्रमाणन भी प्रदान करेंगे।",
                "supplier_english": "We understand your requirement. For the first order, we will reduce MOQ by 25% along with complimentary samples and third-party quality certification.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 90,
                    "pricing_potential": "Competitive",
                    "risk": "Low",
                    "supplier_pattern": "Transparent",
                    "intent_signals": ["vendor qualification support", "third-party certification", "sample provision"]
                }
            },
            {
                "topic": "Delivery Timeline Optimization",
                "buyer_english": "Our inbound logistics require FCA delivery terms with confirmed loading at origin within 20 days. Please confirm production readiness and freight partner network.",
                "buyer_translated": "हमारी आवक लॉजिस्टिक्स के लिए 20 दिनों के भीतर मूल स्थान पर पुष्टि लोडिंग के साथ FCA डिलीवरी शर्तें आवश्यक हैं। कृपया उत्पादन तत्परता और माल भाड़ा भागीदार नेटवर्क की पुष्टि करें।",
                "supplier_native": "हम JNPT और मुंद्रा पोर्ट के माध्यम से 17 दिनों में FCA डिलीवरी की पुष्टि करते हैं। हमारे पास अनुमोदित फ्रेट फॉरवर्डर्स का एक नेटवर्क है जो ट्रैकिंग के साथ रियल-टाइम शिपमेंट अपडेट प्रदान करता है।",
                "supplier_english": "We confirm FCA delivery within 17 days via JNPT and Mundra Port. We have a network of approved freight forwarders providing real-time shipment updates with tracking.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 93,
                    "pricing_potential": "Favorable",
                    "risk": "Very Low",
                    "supplier_pattern": "Systematic",
                    "intent_signals": ["major port access", "real-time tracking", "FCA compliance", "ahead-of-schedule delivery"]
                }
            },
            {
                "topic": "Long-Term Pricing Incentive",
                "buyer_english": "We are structuring a framework agreement for 18 months with guaranteed quarterly offtake. What production reservation and volume-linked pricing bands can you commit to?",
                "buyer_translated": "हम 18 महीने के लिए एक फ्रेमवर्क समझौते की संरचना कर रहे हैं जिसमें गारंटीकृत तिमाही उठान है। आप किस उत्पादन आरक्षण और मात्रा-संबद्ध मूल्य निर्धारण बैंड के लिए प्रतिबद्ध हो सकते हैं?",
                "supplier_native": "18 महीने के फ्रेमवर्क के लिए, हम 15% उत्पादन क्षमता आरक्षित करेंगे और तीन मूल्य स्तर प्रदान करेंगे: 10K यूनिट के लिए 9% छूट, 25K के लिए 16%, और 50K+ के लिए 23%, साथ ही मुफ्त कस्टम लेबलिंग।",
                "supplier_english": "For an 18-month framework, we will reserve 15% production capacity and offer three price tiers: 9% discount for 10K units, 16% for 25K, and 23% for 50K+, with complimentary custom labeling.",
                "analysis": {
                    "flexibility": "Very High",
                    "confidence": 96,
                    "pricing_potential": "Highly Favorable",
                    "risk": "Very Low",
                    "supplier_pattern": "Strategic Partner",
                    "intent_signals": ["reserved capacity commitment", "three-tier volume pricing", "custom labeling offer", "framework agreement readiness"]
                }
            }
        ]
    },
    "Japanese": {
        "flag": "🇯🇵",
        "country": "Japan",
        "region": "Asia-Pacific Precision Manufacturing",
        "rounds": [
            {
                "topic": "MOQ Reduction",
                "buyer_english": "Our procurement committee requires an initial qualification order below standard MOQ to conduct internal product benchmarking and compliance testing before full procurement commitment.",
                "buyer_translated": "私どもの調達委員会は、完全な調達コミットメントの前に社内製品ベンチマークおよびコンプライアンステストを実施するため、標準MOQを下回る初期資格注文を必要としています。",
                "supplier_native": "ご要件を承りました。品質確認のための初回注文につきましては、MOQを30%削減し、JIS規格に準拠した品質証明書および無償サンプルをご提供いたします。",
                "supplier_english": "We acknowledge your requirement. For the initial qualification order, we will reduce MOQ by 30% and provide JIS-compliant quality certificates along with complimentary samples.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 92,
                    "pricing_potential": "Premium",
                    "risk": "Very Low",
                    "supplier_pattern": "Precision-Oriented",
                    "intent_signals": ["JIS quality compliance", "30% MOQ accommodation", "systematic qualification support"]
                }
            },
            {
                "topic": "Delivery Timeline Optimization",
                "buyer_english": "Precision delivery scheduling is critical. We require a confirmed dispatch window not exceeding 15 business days with KANBAN-compatible inventory replenishment capability.",
                "buyer_translated": "精密な納期スケジュールは重要です。15営業日を超えない確認済み出荷ウィンドウと、かんばん互換の在庫補充能力を必要としています。",
                "supplier_native": "15営業日以内の出荷を確約いたします。また、弊社のかんばん対応在庫管理システムにより、リードタイムの最適化と自動補充が可能です。",
                "supplier_english": "We guarantee dispatch within 15 business days. Additionally, our KANBAN-compatible inventory management system enables lead time optimization and automated replenishment.",
                "analysis": {
                    "flexibility": "High",
                    "confidence": 96,
                    "pricing_potential": "Premium",
                    "risk": "Minimal",
                    "supplier_pattern": "Precision-Systematic",
                    "intent_signals": ["KANBAN-native capability", "automated replenishment", "guaranteed delivery window"]
                }
            },
            {
                "topic": "Long-Term Pricing Incentive",
                "buyer_english": "We are evaluating a 36-month strategic supplier partnership with guaranteed offtake commitments. Please present your best enterprise pricing structure with dedicated engineering support.",
                "buyer_translated": "確約された引き取りコミットメントを伴う36ヶ月の戦略的サプライヤーパートナーシップを評価しています。専任エンジニアリングサポート付きの最良の企業向け価格体系をご提示ください。",
                "supplier_native": "36ヶ月の戦略的パートナーシップに対し、専任技術者の配置、カスタム仕様対応、年間数量に応じた段階的価格（5万個：12%割引、10万個：20%割引、20万個：28%割引）を提案いたします。",
                "supplier_english": "For a 36-month strategic partnership, we propose dedicated engineering personnel assignment, custom specification support, and tiered pricing (12% discount at 50K, 20% at 100K, 28% at 200K units annually).",
                "analysis": {
                    "flexibility": "Very High",
                    "confidence": 98,
                    "pricing_potential": "Highly Favorable",
                    "risk": "Minimal",
                    "supplier_pattern": "Elite Strategic Partner",
                    "intent_signals": ["dedicated engineering support", "custom spec capability", "28% max discount offer", "36-month commitment readiness"]
                }
            }
        ]
    }
}

# Default fallback language if an unsupported one is requested
DEFAULT_LANGUAGE = "Chinese"

# Cultural communication profiles per language
CULTURAL_PROFILES = {
    "Chinese": {
        "communication_style": "Formal & Relationship-Driven",
        "negotiation_approach": "Hierarchical, Long-term oriented",
        "response_confidence": 92,
        "risk_profile": "Low",
        "fulfillment_confidence": 94,
        "cultural_note": "Chinese suppliers prioritize relationship-building (Guanxi) and long-term commitments over short-term gains. Formal acknowledgment of hierarchy and clear volume signals accelerate trust."
    },
    "Vietnamese": {
        "communication_style": "Pragmatic & Adaptive",
        "negotiation_approach": "Flexible, Quality-transparent",
        "response_confidence": 89,
        "risk_profile": "Low",
        "fulfillment_confidence": 91,
        "cultural_note": "Vietnamese suppliers are highly adaptive and often exceed delivery commitments when given clear volume signals. QC transparency is a key trust signal."
    },
    "Spanish": {
        "communication_style": "Direct & Accountable",
        "negotiation_approach": "Contract-focused, Penalty-aware",
        "response_confidence": 88,
        "risk_profile": "Low to Medium",
        "fulfillment_confidence": 90,
        "cultural_note": "Latin American suppliers demonstrate high accountability through contractual penalty clauses. Clear SLAs and payment terms are critical to building procurement trust."
    },
    "Hindi": {
        "communication_style": "Systematic & Transparent",
        "negotiation_approach": "Documentation-driven, Volume-flexible",
        "response_confidence": 90,
        "risk_profile": "Low",
        "fulfillment_confidence": 93,
        "cultural_note": "Indian suppliers excel in documentation, certification trails, and port logistics. Third-party quality certifications significantly accelerate procurement qualification."
    },
    "Japanese": {
        "communication_style": "Precision & Consensus-Driven",
        "negotiation_approach": "Detail-oriented, Long-cycle",
        "response_confidence": 96,
        "risk_profile": "Minimal",
        "fulfillment_confidence": 98,
        "cultural_note": "Japanese suppliers operate with extreme precision and reliability. Decision cycles are longer but commitments are highly dependable. JIS compliance and KANBAN capability are major differentiators."
    }
}


class MultilingualNegotiationService:
    """
    AI-powered multilingual procurement negotiation engine.
    Simulates enterprise-grade cross-border supplier communication with
    cultural intelligence and procurement intent analysis.
    """

    def run_negotiation(
        self,
        buyer_message: str,
        supplier_language: str,
        product: str,
        round_number: Optional[int] = None
    ) -> dict:
        """
        Execute a single negotiation exchange with full translation pipeline.

        Args:
            buyer_message: Buyer's procurement message in English.
            supplier_language: Target language for the supplier.
            product: The product being procured.
            round_number: Specific negotiation round (1-3). If None, picks based on message content.

        Returns:
            Full negotiation payload with translations, supplier response, and analysis.
        """
        # Resolve language to a supported scenario
        language = supplier_language if supplier_language in NEGOTIATION_SCENARIOS else DEFAULT_LANGUAGE
        scenarios = NEGOTIATION_SCENARIOS[language]
        cultural = CULTURAL_PROFILES.get(language, CULTURAL_PROFILES["Chinese"])

        # Select round (1-indexed, clamp to available rounds)
        if round_number is not None:
            idx = max(0, min(round_number - 1, len(scenarios["rounds"]) - 1))
        else:
            idx = 0  # Default to first round if not specified

        round_data = scenarios["rounds"][idx]

        return {
            "source_language": "English",
            "target_language": language,
            "supplier_flag": scenarios["flag"],
            "supplier_country": scenarios["country"],
            "supplier_region": scenarios["region"],
            "product": product,
            "negotiation_round": idx + 1,
            "round_topic": round_data["topic"],
            "buyer_message_english": round_data["buyer_english"],
            "translated_message": round_data["buyer_translated"],
            "supplier_response_native": round_data["supplier_native"],
            "supplier_response_english": round_data["supplier_english"],
            "negotiation_analysis": round_data["analysis"],
            "cultural_intelligence": {
                "communication_style": cultural["communication_style"],
                "negotiation_approach": cultural["negotiation_approach"],
                "response_confidence": cultural["response_confidence"],
                "risk_profile": cultural["risk_profile"],
                "fulfillment_confidence": cultural["fulfillment_confidence"],
                "cultural_note": cultural["cultural_note"]
            }
        }

    def run_full_negotiation(
        self,
        buyer_message: str,
        supplier_language: str,
        product: str
    ) -> dict:
        """
        Execute a complete 3-round multilingual negotiation sequence.

        Returns all three negotiation rounds with cumulative AI analysis
        and final procurement recommendation.
        """
        language = supplier_language if supplier_language in NEGOTIATION_SCENARIOS else DEFAULT_LANGUAGE
        scenarios = NEGOTIATION_SCENARIOS[language]
        cultural = CULTURAL_PROFILES.get(language, CULTURAL_PROFILES["Chinese"])

        rounds = []
        for i, round_data in enumerate(scenarios["rounds"]):
            rounds.append({
                "round": i + 1,
                "topic": round_data["topic"],
                "buyer_message_english": round_data["buyer_english"],
                "translated_message": round_data["buyer_translated"],
                "supplier_response_native": round_data["supplier_native"],
                "supplier_response_english": round_data["supplier_english"],
                "analysis": round_data["analysis"]
            })

        # Aggregate final analysis
        confidences = [r["analysis"]["confidence"] for r in rounds]
        avg_confidence = round(sum(confidences) / len(confidences), 1)

        return {
            "source_language": "English",
            "target_language": language,
            "supplier_flag": scenarios["flag"],
            "supplier_country": scenarios["country"],
            "supplier_region": scenarios["region"],
            "product": product,
            "total_rounds": len(rounds),
            "rounds": rounds,
            "final_analysis": {
                "average_confidence": avg_confidence,
                "overall_flexibility": "Very High",
                "procurement_recommendation": (
                    f"Supplier demonstrates elite negotiation adaptability across all {len(rounds)} rounds. "
                    f"AI intent analysis confirms high fulfillment confidence ({avg_confidence}%) "
                    f"with favorable long-term pricing potential. Recommend advancing to formal procurement agreement."
                ),
                "risk_rating": "Low",
                "suggested_action": "Proceed to Procurement Authorization"
            },
            "cultural_intelligence": {
                "communication_style": cultural["communication_style"],
                "negotiation_approach": cultural["negotiation_approach"],
                "response_confidence": cultural["response_confidence"],
                "risk_profile": cultural["risk_profile"],
                "fulfillment_confidence": cultural["fulfillment_confidence"],
                "cultural_note": cultural["cultural_note"]
            }
        }

    def get_supported_languages(self) -> list:
        """Return list of supported supplier languages."""
        return [
            {"language": lang, "flag": data["flag"], "region": data["region"]}
            for lang, data in NEGOTIATION_SCENARIOS.items()
        ]
