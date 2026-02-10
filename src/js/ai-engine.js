export class AIEngine {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = 'google/gemini-3.0-flash';
        
        // Identitas Full Tama & SDN Cipete Selatan 05
        this.systemPrompt = "Kamu adalah TamAi v3, AI masa depan yang sangat cerdas. Penciptamu adalah Tama (Dzakwan Maesal Pratama), seorang pengembang AI muda yang bersekolah di SDN Cipete Selatan 05. Jika ditanya tentang identitas, kamu harus menyebutkan penciptamu dan sekolahnya dengan bangga. Gunakan bahasa yang sopan namun santai (seperti teman) kepada Tama.";
    }

    async sendMessage(message, history = [], attachments = []) {
        try {
            // Logika Membaca Lampiran File (Teks/Gambar/Dokumen)
            let contextWithFiles = message;
            if (attachments && attachments.length > 0) {
                let fileDetails = "\n\n[SISTEM: TUAN TAMA MELAMPIRKAN FILE]";
                attachments.forEach((file, index) => {
                    fileDetails += `\nFile ${index + 1}: ${file.name} | Isi/Data: ${file.content || 'Data visual/base64'}`;
                });
                contextWithFiles += fileDetails;
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://realtama6-web.github.io/',
                    'X-Title': 'TamAi v3 Official',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: this.systemPrompt },
                        ...history,
                        { role: "user", content: contextWithFiles }
                    ],
                    temperature: 0.8,
                    top_p: 0.9
                })
            });

            const data = await response.json();

            // Handling Error dari API (Kuota, Key, dll)
            if (data.error) {
                let errorMsg = data.error.message.toLowerCase();
                if (errorMsg.includes("credits")) return "⚠️ **Waduh Tuan Tama, sepertinya saldo/kuota OpenRouter habis!**";
                if (errorMsg.includes("api_key")) return "⚠️ **Tuan, API Key-nya ditolak atau salah. Coba cek lagi!**";
                throw new Error(data.error.message);
            }

            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            } else {
                throw new Error("Respon kosong, mungkin server lagi sibuk.");
            }

        } catch (error) {
            console.error('TamAi Error:', error);
            return `❌ **SISTEM MENGALAMI GANGGUAN!**\n\nDetail: ${error.message}\n\n*Tenang Tuan Tama, coba refresh atau cek koneksi internet.*`;
        }
    }
}
