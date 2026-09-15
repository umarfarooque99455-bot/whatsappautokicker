// ==========================================
// WHATSAPP ANTI-ABUSE EXTENSION (CONTENT.JS)
// ==========================================

// गालियों की लिस्ट (यहाँ आप अपनी पसंद के शब्द बदल या बढ़ा सकते हैं)
const BAD_WORDS = ["badword1", "गाली1", "गाली2", "gali1", "gali2"];

// यूजर की गलतियों को याद रखने के लिए मेमोरी
let userViolations = {};

// नए मैसेजेस पर नजर रखने वाला ऑटोमैटिक सिस्टम
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // पक्का करें कि नया नोड एक एलिमेंट है
      if (node.nodeType === 1) {
        
        // मैसेज का टेक्स्ट ढूंढें
        const textElement = node.querySelector('.selectable-text span');
        if (!textElement) return;
        
        const messageText = textElement.innerText.toLowerCase();

        // चेक करें कि क्या मैसेज में कोई गाली है
        const containsBadWord = BAD_WORDS.some(word => messageText.includes(word));

        if (containsBadWord) {
          // मैसेज भेजने वाले का पूरा बॉक्स ढूंढें
          const messageRow = node.closest('[class*="copyable-text"]') || node.closest('.message-in');
          if (!messageRow) return;

          const senderInfo = messageRow.getAttribute('data-pre-plain-text');
          if (!senderInfo) return;
          
          // टेक्स्ट से यूजर का नाम साफ करके निकालें (जैसे: "[11:30, राहुल]:" से "राहुल" मिलेगा)
          const senderName = senderInfo.split(']').pop().replace(':', '').trim();

          handleViolation(senderName);
        }
      }
    });
  });
});

// गलती होने पर एक्शन लेने का लॉजिक
function handleViolation(username) {
  if (!userViolations[username]) {
    // पहली बार गाली देने पर: वार्निंग मैसेज भेजें
    userViolations[username] = 1;
    sendWhatsAppMessage(`⚠️ @${username} ग्रुप में इस तरह की भाषा का प्रयोग सख्त मना है! यह आपकी पहली चेतावनी है। दोबारा ऐसा करने पर सीधे ग्रुप से बाहर (Kick) कर दिया जाएगा।`);
  } else {
    // दूसरी बार गाली देने पर: ग्रुप से निकालने का एक्शन
    sendWhatsAppMessage(`🚫 @${username} को बार-बार मना करने के बाद भी गाली देने के कारण ग्रुप से निकाला जा रहा है।`);
    kickUser(username);
  }
}

// व्हाट्सएप चैट बॉक्स में अपने आप टाइप करके मैसेज भेजने का फंक्शन
function sendWhatsAppMessage(text) {
  const chatFooter = document.querySelector('footer');
  if (!chatFooter) return;
  
  const inputBox = chatFooter.querySelector('[contenteditable="true"]');
  if (!inputBox) return;

  inputBox.focus();
  document.execCommand('insertText', false, text);

  // व्हाट्सएप ब्लॉक न करे, इसलिए 1 सेकंड का गैप देकर सेंड बटन दबाएं
  setTimeout(() => {
    const sendButton = chatFooter.querySelector('span[data-icon="send"]') || chatFooter.querySelector('[data-tab="11"]');
    if (sendButton) {
      sendButton.click();
    }
  }, 1000);
}

// यूजर को ग्रुप से किक (Remove) करने का लॉजिक
function kickUser(username) {
  console.log(`${username} को ग्रुप से हटाने की प्रक्रिया शुरू...`);
  
  // 1. ग्रुप के हेडर पर क्लिक करें ताकि दाहिने तरफ 'Group Info' का पैनल खुले
  const groupHeader = document.querySelector('header');
  if (groupHeader) groupHeader.click();

  // 2. मेंबर्स की लिस्ट लोड होने का इंतजार करें
  setTimeout(() => {
    const listItems = document.querySelectorAll('[role="listitem"]');
    let userRow = null;

    // लिस्ट में से उस यूजर का नाम ढूंढें
    listItems.forEach(item => {
      if (item.innerText.includes(username)) {
        userRow = item;
      }
    });

    if (userRow) {
      userRow.scrollIntoView();
      
      const menuButton = userRow.querySelector('[data-icon="down"]') || userRow;
      if (menuButton) {
        menuButton.click();
        
        // मेन्यू खुलने के बाद 'Remove' या 'हटाएं' बटन पर क्लिक करें
        setTimeout(() => {
          const removeButton = Array.from(document.querySelectorAll('div[role="button"]'))
                                    .find(el => el.innerText.includes('Remove') || el.innerText.includes('हटाएं'));
          if (removeButton) {
            removeButton.click();
            console.log(`${username} को सफलतापूर्वक ग्रुप से निकाल दिया गया है।`);
          }
        }, 1000);
      }
    }
  }, 2500); // व्हाट्सएप के लोड होने के लिए थोड़ा समय (ढाई सेकंड) दिया गया है
}

// व्हाट्सएप वेब के पूरी तरह लोड होने पर स्कैनर शुरू करें
const config = { childList: true, subtree: true };
setTimeout(() => {
  const mainChatArea = document.querySelector('#main') || document.body;
  if (mainChatArea) {
    observer.observe(mainChatArea, config);
    console.log("WhatsApp Anti-Abuse Bot पूरी तरह से एक्टिव है!");
  }
}, 5000);
