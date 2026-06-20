const { GoogleGenAI } = require('@google/genai');

exports.chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ 
        status: 'error', 
        message: 'GEMINI_API_KEY is not configured on the server.' 
      });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemInstruction = `Bạn là một trợ lý ảo tư vấn khách hàng cho một cửa hàng thương mại điện tử. 
Hãy trả lời ngắn gọn, lịch sự, thân thiện và hữu ích. 
Nếu khách hàng hỏi về các chính sách, bạn có thể hướng dẫn chung chung hoặc bảo họ liên hệ tổng đài. 
Nếu khách hàng hỏi về sản phẩm, hãy hỏi thêm chi tiết để tư vấn.`;

    // Construct the payload for Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      status: 'success',
      reply: response.text
    });

  } catch (error) {
    console.error('AI Chatbot Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to communicate with AI Chatbot' });
  }
};
