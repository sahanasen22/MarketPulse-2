function sendMessage() {
    const msgInput = document.getElementById("message");
    const msg = msgInput.value.trim();
    if (!msg) return;

    // Optimistic UI update
    const box = document.getElementById("chat-box");
    box.innerHTML += `
        <div class="user-msg">
            <div class="msg-content">${msg}</div>
        </div>
    `;
    box.scrollTop = box.scrollHeight;
    msgInput.value = "";

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                box.innerHTML += `<div class="text-danger text-center mt-2">Error: ${data.error}</div>`;
                return;
            }

            // Safely parse Markdown
            let renderedReply = data.reply;
            try {
                if (typeof marked !== 'undefined') {
                    renderedReply = marked.parse(data.reply);
                }
            } catch (e) {
                console.error("Markdown parsing error:", e);
            }

            box.innerHTML += `
            <div class="bot-msg">
                <div class="msg-content">${renderedReply}</div>
            </div>
        `;


            box.scrollTop = box.scrollHeight;
        });
}


// Load today's history on page load
document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/chat/history/today")
        .then(res => res.json())
        .then(data => {
            const box = document.getElementById("chat-box");
            if (data.length > 0) {
                // Clear initial greeting if history exists
                box.innerHTML = "";
                data.forEach(chat => {
                    // User message
                    box.innerHTML += `
                        <div class="user-msg">
                            <div class="msg-content">${chat.message}</div>
                        </div>
                    `;

                    // Bot response
                    let renderedReply = chat.response;
                    try {
                        if (typeof marked !== 'undefined') {
                            renderedReply = marked.parse(chat.response);
                        }
                    } catch (e) { }

                    box.innerHTML += `
                        <div class="bot-msg">
                            <div class="msg-content">${renderedReply}</div>
                        </div>
                    `;
                });
                box.scrollTop = box.scrollHeight;
            }
        });
});

async function downloadChatPDF() {
    const { jsPDF } = window.jspdf;

    // Show loading state
    const btn = document.querySelector('button[onclick="downloadChatPDF()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Generating...";
    btn.disabled = true;

    try {
        // Fetch all today's chats to ensure completeness
        const res = await fetch("/api/chat/history/today");
        const chats = await res.json();

        if (chats.length === 0) {
            alert("No chat history found for today.");
            return;
        }

        const doc = new jsPDF();
        let yOffset = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxLineWidth = pageWidth - (margin * 2);

        // Header Style
        doc.setFillColor(40, 116, 166);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text("MarketPulse AI Report", margin, 25);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Daily Intelligence Briefing - ${new Date().toLocaleDateString()}`, margin, 33);

        yOffset = 55;

        chats.forEach((chat, index) => {
            // Check for page overflow
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 20;
            }

            // User Message
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(100, 100, 100);
            doc.text("USER QUERY:", margin, yOffset);
            yOffset += 6;

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(44, 62, 80);
            const userLines = doc.splitTextToSize(chat.message, maxLineWidth);
            doc.text(userLines, margin, yOffset);
            yOffset += (userLines.length * 6) + 6;

            // Bot Message
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(40, 116, 166);
            doc.text("MARKETPULSE ANALYSIS:", margin, yOffset);
            yOffset += 6;

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(33, 33, 33);

            // Note: Since marked.parse returns HTML, we use the raw response for PDF
            const botLines = doc.splitTextToSize(chat.response, maxLineWidth);

            if (yOffset + (botLines.length * 6) > 280) {
                doc.addPage();
                yOffset = 20;
            }

            doc.text(botLines, margin, yOffset);
            yOffset += (botLines.length * 6) + 12;

            // Separator
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yOffset - 6, pageWidth - margin, yOffset - 6);
            yOffset += 4;
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount} | MarketPulse Confidential`, margin, 290);
        }

        doc.save(`MarketPulse_Today_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("Failed to generate PDF. Check console for details.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}