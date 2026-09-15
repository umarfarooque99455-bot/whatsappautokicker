// ==========================================
// WHATSAPP ANTI-ABUSE EXTENSION (CONTENT.JS)
// ==========================================

// गालियों की लिस्ट (आप चाहें तो बाद में इसमें और शब्द जोड़ सकते हैं)
const BAD_WORDS = ["badword1", "गाली1", "गाली2", "gali1", "gali2"];

// यूजर की गलतियों का हिसाब रखने के लिए मेमोरी
let userViolations = {};

// व्हाट्सएप के नए मैसेजेस पर नजर रखने वाला सिस्टम (MutationObserver)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // चेक करें कि क्या यह कोई नया मैसेज बॉक्स है
      if (node.nodeType === 1 && (node.classList.contains('message-in') || node.querySelector('[class*="copyable-text"]'))) {
        
        // 1. मैसेज भेजने वाले का नाम या नंबर ढूंढें
        const nameElement = node.querySelector('[class*="copyable-text"]');
        if (!nameElement) return;
        
        const senderInfo = nameElement.getAttribute('data-pre-plain-text');
        if (!senderInfo) return;
        
        // नाम को साफ करके निकालें (जैसे: "[12:30, 15/09/2026] Rahul:" से "Rahul" मिलेगा)
        const senderName = senderInfo.split(']').pop().replace(':', '').trim();

        // 2. मैसेज का टेक्स्ट ढूंढें
        const textElement = node.querySelector('.selectable-text span');
        if (!textElement) return;
        const messageText = textElement.innerText.toLowerCase();

        // 3. चेक करें कि क्या मैसेज में कोई गाली है
        const containsBadWord = BAD_WORDS.some(word => messageText.includes(word));

        if (containsBadWord) {
          handleViolation(senderName);
        }
      }
    });
  });
});

// उल्लंघन (Violation) होने पर क्या करना है
function handleViolation(username) {
  if (!userViolations[username]) {
    // पहली बार गाली देने पर: वार्निंग मैसेज भेजें
    userViolations[username] = 1;
    sendWhatsAppMessage(`⚠️ @${username} ग्रुप में गाली देना सख्त मना है! यह आपकी पहली और आखिरी चेतावनी है। अगली बार सीधे ग्रुप से निकाल (Kick) दिया जाएगा।`);
  } else {
    // दूसरी बार गाली देने पर: किक करने का एक्शन शुरू करें
    sendWhatsAppMessage(`🚫 @${username} को बार-बार मना करने के बाद भी गाली देने के कारण ग्रुप से निकाला जा रहा है।`);
    kickUser(username);
  }
}

// व्हाट्सएप चैट बॉक्स में अपने आप मैसेज टाइप करके भेजने का फंक्शन
function sendWhatsAppMessage(text) {
  const chatFooter = document.querySelector('footer');
  if (!chatFooter) return;
  
  const inputBox = chatFooter.querySelector('[contenteditable="true"]');
  if (!inputBox) return;

  // चैट बॉक्स पर फोकस करके टेक्स्ट डालें
  inputBox.focus();
  document.execCommand('insertText', false, text);

  // 1 सेकंड का गैप देकर सेंड बटन दबाएं ताकि व्हाट्सएप को शक न हो
  setTimeout(() => {
    const sendButton = chatFooter.querySelector('span[data-icon="send"]') || chatFooter.querySelector('[data-tab="11"]');
    if (sendButton) {
      sendButton.click();
    }
  }, 1000);
}

// यूजर को ग्रुप से किक (Remove) करने का लॉजिक
function kickUser(username) {
  console.log(`${username} को किक करने की प्रक्रिया शुरू...`);
  
  // 1. ग्रुप के हेडर (ऊपर पट्टी जहाँ ग्रुप का नाम होता है) पर क्लिक करें ताकि राइट साइड में 'Group Info' खुले
  const groupHeader = document.querySelector('header');
  if (groupHeader) groupHeader.click();

  // 2. राइट साइड पैनल और मेंबर्स लिस्ट लोड होने का इंतजार करें
  setTimeout(() => {
    // व्हाट्सएप के साइड पैनल में मेंबर्स की लिस्ट ढूंढें
    const listItems = document.querySelectorAll('[role="listitem"]');
    let userRow = null;

    // लिस्ट में से उस यूजर का नाम ढूंढें जिसने गाली दी थी
    listItems.forEach(item => {
      if (item.innerText.includes(username)) {
        userRow = item;
      }
    });

    if (userRow) {
      userRow.scrollIntoView();
      
      // मेंबर के नाम के पास बने मेन्यू या ऐरो बटन पर क्लिक करें
      const menuButton = userRow.querySelector('[data-icon="down"]') || userRow;
      if (menuButton) {
        menuButton.click();
        
        // 'Remove' या 'हटाएं' बटन पर क्लिक करने के लिए 1 सेकंड रुकें
        setTimeout(() => {
          const removeButton = Array.from(document.querySelectorAll('div[role="button"]'))
                                    .find(el => el.innerText.includes('Remove') || el.innerText.includes('हटाएं'));
          if (removeButton) {
            removeButton.click();
            console.log(`${username} को ग्रुप से बाहर निकाल दिया गया है।`);
          }
        }, 1000);
      }
    }
  }, 2500); // लिस्ट लोड होने के लिए ढाई सेकंड का समय दिया गया है
}

// व्हाट्सएप वेब के पूरी तरह लोड होने पर ही स्कैनर को चालू करें
const config = { childList: true, subtree: true };
setTimeout(() => {
  const mainChatArea = document.querySelector('#main') || document.body;
  observer.observe(mainChatArea, config);
  console.log("WhatsApp Anti-Abuse Bot पूरी तरह से एक्टिव है!");
}, 5000);
