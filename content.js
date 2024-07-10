// Function to wait for an element with a specific selector to be added to the DOM
function waitForElement(selector) {
    return new Promise((resolve) => {
        // Check if the element already exists
        let element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        // Create a MutationObserver to watch for changes to the DOM
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                for (let node of mutation.addedNodes) {
                    if (node.matches && node.matches(selector)) {
                        observer.disconnect();
                        resolve(node);
                        return;
                    }
                }
            }
        });

        // Start observing the document for childList changes
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

async function getSubs(langCode = 'en') {
    let ct = JSON.parse((await (await fetch(window.location.href)).text()).split('ytInitialPlayerResponse = ')[1].split(';var')[0]).captions.playerCaptionsTracklistRenderer.captionTracks, findCaptionUrl = x => ct.find(y => y.vssId.indexOf(x) === 0)?.baseUrl, firstChoice = findCaptionUrl("." + langCode), url = firstChoice ? firstChoice + "&fmt=json3" : (findCaptionUrl(".") || findCaptionUrl("a." + langCode) || ct[0].baseUrl) + "&fmt=json3&tlang=" + langCode;
    return (await (await fetch(url)).json()).events.map(x => ({...x, text: x.segs?.map(x => x.utf8)?.join(" ")?.replace(/\n/g,' ')?.replace(/♪|'|"|\.{2,}|\<[\s\S]*?\>|\{[\s\S]*?\}|\[[\s\S]*?\]/g,'')?.trim() || ''}));
}
async function logSubs(langCode) {
    const subs = await getSubs(langCode);
    return subs;
}

// Function to load the JSON file
async function loadSubtitles(filename) {
    return new Promise((resolve, reject) => {
      fetch(chrome.runtime.getURL(filename))
        .then(response => response.json())
        .then(data => {
          console.log('Loaded JSON data:', data);
          resolve(data);
        })
        .catch(error => {
          console.error('Error loading JSON file:', error);
          reject(error);
        });
    });
  }

// Usage example with async/await
async function run() {
    console.log("Waiting for element...");
    const element = await waitForElement('.html5-video-container');
    console.log("Element found:", element);
    // Perform actions with the found element

    var currentSubtitle;

    var subtitles = await loadSubtitles('subtitles.json');

    // Get subtitles
    const currentSubs = logSubs("en");

    // Create a subtitle container
    const subtitleContainer = document.createElement('div');
    subtitleContainer.setAttribute('id', 'custom-subtitles');
    document.getElementsByClassName('html5-video-container')[0].appendChild(subtitleContainer);

    const nativeContainer = document.createElement('div');
    nativeContainer.setAttribute('id', 'native-subtitles');
    subtitleContainer.appendChild(nativeContainer);

    const learnContainer = document.createElement('div');
    learnContainer.setAttribute('id', 'learn-subtitles');
    subtitleContainer.appendChild(learnContainer);

    // Function to show subtitles
    function showSubtitle(text) {
        //text an array, can you add a loop here to show all the text with every item different color
        nativeContainer.innerHTML = '';
        learnContainer.innerHTML = '';
        text["id"].forEach((item, index) => {
            const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
            
            const nativeSubtitle = document.createElement('p');
            nativeSubtitle.textContent = item;
            if (index != 0)
                nativeSubtitle.style.marginLeft = "4px";
            nativeSubtitle.style.color = color;
            nativeContainer.appendChild(nativeSubtitle);

            const learnSubtitle = document.createElement('p');
            learnSubtitle.textContent = text["tr"][index];
            if (index != 0)
                learnSubtitle.style.marginLeft = "4px";
            learnSubtitle.style.color = color;
            learnContainer.appendChild(learnSubtitle);
        });
    }

    // Monitor video time and show appropriate subtitle
    const videoElement = document.querySelector('video');
    if (videoElement) {
        videoElement.addEventListener('timeupdate', () => {
            const currentTime = videoElement.currentTime * 1000;
            const subtitle = subtitles.find(sub => currentTime >= sub.tStartMs && currentTime < sub.tStartMs + sub.dDurationMs);
            if (subtitle && subtitle !== currentSubtitle) {
                currentSubtitle = subtitle;
                showSubtitle(subtitle.text);
            }
        });
    }
}

// Call the function to start waiting
run();