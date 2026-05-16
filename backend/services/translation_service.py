import random

class TranslationService:
    """
    AI-powered translation service for procurement communication.
    Supports Chinese, Hindi, Vietnamese, Spanish, and German.
    """
    
    def __init__(self):
        self.templates = {
            "Chinese": {
                "greeting": "尊敬的供应商,",
                "intro": "我们正在启动以下要求的采购寻找讨论。",
                "closing": "此致,\nProcureAI 自主采购代理",
                "requirements": "请回复以下信息：\n* 最小起订量 (MOQ)\n* 交货时间\n* 价格分级\n* 生产能力\n* 出口认证",
                "confirmation": "感谢您的采购需求。对于长期合作，我们可以降低MOQ并提供优先生产排期。"
            },
            "Hindi": {
                "greeting": "नमस्ते आपूर्तिकर्ता,",
                "intro": "हम निम्नलिखित आवश्यकताओं के लिए खरीद सोर्सिंग चर्चा शुरू कर रहे हैं।",
                "closing": "सादर,\nProcureAI स्वायत्त खरीद एजेंट",
                "requirements": "कृपया निम्नलिखित के साथ उत्तर दें:\n* MOQ\n* लीड समय\n* मूल्य निर्धारण स्तर\n* उत्पादन क्षमता\n* निर्यात प्रमाणपत्र",
                "confirmation": "आपकी खरीद जांच के लिए धन्यवाद। दीर्घकालिक सहयोग के लिए, हम MOQ को कम कर सकते हैं और उत्पादन शेड्यूलिंग को प्राथमिकता दे सकते हैं।"
            },
            "Vietnamese": {
                "greeting": "Kính gửi nhà cung cấp,",
                "intro": "Chúng tôi đang bắt đầu thảo luận tìm nguồn cung ứng cho các yêu cầu sau.",
                "closing": "Trân trọng,\nĐại lý mua hàng tự động ProcureAI",
                "requirements": "Vui lòng phản hồi với:\n* MOQ\n* thời gian dẫn\n* các mức giá\n* năng lực sản xuất\n* chứng nhận xuất khẩu",
                "confirmation": "Cảm ơn bạn đã yêu cầu mua hàng. Đối với sự hợp tác lâu dài, chúng tôi có thể giảm MOQ và ưu tiên lập kế hoạch sản xuất."
            },
            "Spanish": {
                "greeting": "Estimado proveedor,",
                "intro": "Estamos iniciando una discusión de abastecimiento para los siguientes requisitos.",
                "closing": "Saludos,\nAgente de Compras Autónomo ProcureAI",
                "requirements": "Por favor responda con:\n* MOQ\n* tiempo de entrega\n* niveles de precios\n* capacidad de producción\n* certificaciones de exportación",
                "confirmation": "Gracias por su consulta de compra. Para una colaboración a largo plazo, podemos reducir el MOQ y priorizar la programación de producción."
            },
            "German": {
                "greeting": "Sehr geehrter Lieferant,",
                "intro": "Wir leiten eine Beschaffungsdiskussion für die folgenden Anforderungen ein.",
                "closing": "Mit freundlichen Grüßen,\nProcureAI Autonomer Beschaffungsagent",
                "requirements": "Bitte antworten Sie mit:\n* MOQ\n* Lieferzeit\n* Preisstaffeln\n* Produktionskapazität\n* Exportzertifizierungen",
                "confirmation": "Vielen Dank für Ihre Bestellanfrage. Für eine langfristige Zusammenarbeit können wir die Mindestbestellmenge reduzieren und die Produktionsplanung priorisieren."
            }
        }

    def translate_message(self, message: str, target_language: str) -> str:
        """
        Translates a message to the target language.
        For MVP, we use templates and mock translation.
        """
        if target_language not in self.templates:
            return message # Fallback to English
            
        template = self.templates[target_language]
        
        # Simple "AI" translation simulation
        translated = f"{template['greeting']}\n\n{template['intro']}\n\n[TRANSLATED]: {message}\n\n{template['requirements']}\n\n{template['closing']}"
        return translated

    def detect_language(self, region: str) -> str:
        """
        Auto-detect language based on region.
        """
        mapping = {
            "China": "Chinese",
            "Vietnam": "Vietnamese",
            "India": "Hindi",
            "Germany": "German",
            "Japan": "Japanese", # Note: Template doesn't have Japanese yet, but we'll add if needed
            "Spain": "Spanish",
            "Mexico": "Spanish"
        }
        return mapping.get(region, "English")

    def simulate_supplier_reply(self, language: str) -> dict:
        """
        Simulates a supplier reply in the native language and provides translation/analysis.
        """
        replies = {
            "Chinese": "感谢您的采购需求。对于长期合作，我们可以降低MOQ并提供优先生产排期。",
            "Hindi": "आपकी खरीद जांच के लिए धन्यवाद। दीर्घकालिक सहयोग के लिए, हम MOQ को कम कर सकते हैं और उत्पादन शेड्यूलिंग को प्राथमिकता दे सकते हैं।",
            "Vietnamese": "Cảm ơn bạn đã yêu cầu mua hàng. Đối với sự hợp tác lâu dài, chúng tôi có thể giảm MOQ và ưu tiên lập kế hoạch sản xuất.",
            "Spanish": "Gracias por su consulta de compra. Para una colaboración a largo plazo, podemos reducir el MOQ y priorizar la programación de producción.",
            "German": "Vielen Dank für Ihre Bestellanfrage. Für eine langfristige Zusammenarbeit können wir die Mindestbestellmenge reduzieren und die Produktionsplanung priorisieren."
        }
        
        native_reply = replies.get(language, "Thank you for your inquiry. We are interested in collaborating.")
        
        # Mock interpretation
        analysis = {
            "pricing_flexibility": random.choice(["HIGH", "MODERATE", "LOW"]),
            "moq_flexibility": random.choice(["HIGH", "MODERATE", "LOW"]),
            "lead_time_risk": random.choice(["LOW", "MEDIUM", "HIGH"]),
            "partnership_intent": random.choice(["STRONG", "NEUTRAL", "CAUTIOUS"]),
            "extracted_insight": "Supplier demonstrates strong long-term fulfillment capability with moderate pricing flexibility."
        }
        
        return {
            "native_reply": native_reply,
            "translated_reply": "Thank you for your procurement inquiry. For long-term collaboration, we can reduce MOQ and prioritize production scheduling.",
            "analysis": analysis
        }
