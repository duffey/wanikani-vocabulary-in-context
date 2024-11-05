// ==UserScript==
// @name         Wanikani Vocabulary in Context
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Display vocabulary in context sentences during reviews
// @author       Scott Duffey
// @match        https://www.wanikani.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Ensure WKOF is installed
    if (!window.wkof) {
        alert('This script requires WaniKani Open Framework.\nYou will now be forwarded to installation instructions.');
        window.location.href = 'https://community.wanikani.com/t/instructions-installing-wanikani-open-framework/28549';
        return;
    }

    // Include the necessary WKOF module and load items
    let subjects = [];
    wkof.include('ItemData');
    wkof.ready('ItemData').then(() => {
        const config = { wk_items: { options: { subjects: true } } };
        wkof.ItemData.get_items(config).then(items => {
            subjects = items;
            console.log('All subjects loaded:', subjects);

            // Start observing for changes
            let currentSubjectId = null;
            let currentResponseType = null;

            const observer = new MutationObserver(() => {
                const subjectLabel = document.querySelector('label[for="user-response"][data-subject-id]');
                if (!subjectLabel) return;

                const newSubjectId = parseInt(subjectLabel.getAttribute('data-subject-id'));
                const newResponseType = subjectLabel.getAttribute('data-question-type');

                // Update only if subject ID or question type changed
                if ((newSubjectId !== currentSubjectId || newResponseType !== currentResponseType) && subjects.length > 0) {
                    currentSubjectId = newSubjectId;
                    currentResponseType = newResponseType;
                    console.log(`Subject changed. Subject ID: ${currentSubjectId}, Type: ${currentResponseType}`);

                    // Find the subject data
                    const subject = subjects.find(subj => subj.id === newSubjectId);
                    if (!subject || !subject.data.context_sentences) return;

                    const charactersElement = document.querySelector('#turbo-body > div.quiz > div > div.character-header.character-header--vocabulary > div > div.character-header__characters');
                    if (!charactersElement) return;

                    const word = subject.data.characters;
                    const sentence = subject.data.context_sentences.find(sent => sent.ja.includes(word));
                    if (sentence) {
                        const highlightedSentence = sentence.ja.replaceAll(word, `<mark>${word}</mark>`);
                        charactersElement.innerHTML = highlightedSentence;

                        // Add padding to characters element and style <mark>
                        charactersElement.style.padding = '0.5em';
                        const marks = charactersElement.querySelectorAll('mark');
                        marks.forEach(mark => {
                            mark.style.background = 'none';
                            mark.style.color = 'yellow';
                        });
                    } else {
                        console.log('No suitable context sentence found with exact word match.');
                    }
                }
            });

            // Start observing the DOM
            observer.observe(document.body, { childList: true, subtree: true });
        });
    });
})();
