(() => {
   "use strict";
   document.addEventListener('DOMContentLoaded', () => {
      // Meetings page //

      // Copying text to the clipboard
      const copyButton = document.getElementById("copy-link-button");

      function copyTextToClipboard(text) {
         const tempElement = document.createElement("textarea");
         tempElement.value = text;
         document.body.appendChild(tempElement);
         tempElement.select();
         document.execCommand("copy");
         document.body.removeChild(tempElement);
      }

      if (copyButton) {
         copyButton.addEventListener('click', function () {
            const copyText = document.getElementById("video-chat-link").textContent;
            copyTextToClipboard(copyText);
            copyButton.disabled = true;
            const originalButtonText = copyButton.innerHTML;
            copyButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10.0007 15.1709L19.1931 5.97852L20.6073 7.39273L10.0007 17.9993L3.63672 11.6354L5.05093 10.2212L10.0007 15.1709Z" fill="#9CA3AF"/>
                 </svg>`;

            setTimeout(function () {
               copyButton.disabled = false;
               copyButton.innerHTML = originalButtonText;
            }, 2000);
         });
      }

      // Selecting timezones
      const timezoneSelect = document.getElementById('timezone-select');

      function populateTimezones(timezoneSelect) {
         const allTimezones = moment.tz.names();

         allTimezones.forEach((timezone) => {
            const option = document.createElement('option');
            const now = moment().tz(timezone);
            const offset = now.format('Z');
            option.value = timezone;
            option.text = `(GMT${offset}) ${timezone}`;
            timezoneSelect.appendChild(option);
         });
      }

      if (timezoneSelect) populateTimezones(timezoneSelect);

      // Video chat counter
      const videoChatCounter = document.querySelector('[data-video-chat-counter]');
      let value = 0;

      function handleCounterClick(e) {
         const isIncrement = e.target.classList.contains('video-chat-modal__counter-button_increment');
         value = isIncrement ? value + 1 : Math.max(value - 1, 0);
         videoChatCounter.querySelector('input').value = value;
      }

      if (videoChatCounter) videoChatCounter.addEventListener('click', handleCounterClick);

      // Initializing forms and their event handlers
      const formHostMeeting = document.getElementById('form-host-meeting');
      const formJoinMeeting = document.getElementById('form-join-meeting');
      const formScheduleMeeting = document.getElementById('form-schedule-meeting');

      if (formHostMeeting && formJoinMeeting && formScheduleMeeting) {
         formHostMeeting.addEventListener('submit', hostMeetingFormSend);
         formJoinMeeting.addEventListener('submit', joinMeetingFormSend);
         formScheduleMeeting.addEventListener('submit', scheduleMeetingFormSend);
         formHostMeeting.addEventListener('reset', () => formReset(formHostMeeting, '#host-meeting'));
         formJoinMeeting.addEventListener('reset', () => formReset(formJoinMeeting, '#join-meeting'));
         formScheduleMeeting.addEventListener('reset', () => formReset(formScheduleMeeting, '#schedule-meeting'));
      }

      // Functions for form handling

      async function hostMeetingFormSend(e) {
         e.preventDefault();
         const error = formValidate(formHostMeeting);
         if (error === 0) {
            formReset(formHostMeeting, '#host-meeting');
         }
      }

      async function joinMeetingFormSend(e) {
         e.preventDefault();
         const error = formValidate(formJoinMeeting);
         if (error === 0) {
            formReset(formJoinMeeting, '#join-meeting');
         }
      }

      async function scheduleMeetingFormSend(e) {
         e.preventDefault();
         const error = formValidate(formScheduleMeeting);
         if (error === 0) {
            const meetingData = getMeetingFormData();
            meetingsData.push(meetingData);
            addMeetingItem(meetingData);
            formReset(formScheduleMeeting, '#schedule-meeting');
         }
      }

      function formValidate(form) {
         let error = 0;
         const formReq = form.querySelectorAll('._req');
         formReq.forEach(input => {
            removeError(input);
            if (
               ((input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') && input.value.trim() === '')
               ||
               (input.classList.contains('video-chat-modal__participants-list') && input.childElementCount === 0)
            ) {
               addError(input, form);
               error++;
            }
         });
         return error;
      }

      function addError(formRequiredItem, form) {
         formRequiredItem.classList.add('_form-error');
         formRequiredItem.parentElement.classList.add('_form-error');
         const errorElements = form.querySelectorAll('.video-chat-modal__error');
         if (errorElements.length === 0) {
            form.insertAdjacentHTML('beforeend', `<div class="video-chat-modal__error">Please fill out all fields.</div>`);
         }
      }

      function removeError(formRequiredItem) {
         formRequiredItem.classList.remove('_form-error');
         formRequiredItem.parentElement.classList.remove('_form-error');
      }

      function removeAllErrors(form) {
         const formErrors = form.querySelectorAll('.video-chat-modal__error');
         if (formErrors) {
            formErrors.forEach(errorElement => {
               errorElement.remove();
            });

            form.querySelectorAll('._req').forEach(item => {
               item.classList.remove('_form-error');
               item.parentElement.classList.remove('_form-error');
            });
         }
      }

      function formReset(form, id) {
         $(id).modal('hide');
         form.reset();
         removeAllErrors(form);
         if (form.querySelector('.video-chat-modal__participants-list')) {
            form.querySelector('.video-chat-modal__participants-list').innerHTML = '';
            document.querySelectorAll('.modal-participants__item').forEach(item => {
               item.classList.remove('active');
            });
         }
      }

      // Initializing modals with participants

      const allParticipants = [
         { name: 'Ralph Edwards', imgSrc: 'img/video-chat-page/participants/07.jpg' },
         { name: 'Devon Lane', imgSrc: 'img/video-chat-page/participants/08.jpg' },
         { name: 'Robert Fox', imgSrc: 'img/video-chat-page/participants/09.jpg' }
      ];

      const selectedParticipants = [];

      if (formHostMeeting && formScheduleMeeting) {
         initializeModal(allParticipants, '#host-meeting', '#host-meeting-participants');
         initializeModal(allParticipants, '#schedule-meeting', '#schedule-meeting-participants');
      }

      function initializeModal(allParticipants, modalSelector, participantModalSelector) {
         const participantsList = document.querySelector(modalSelector + ' .video-chat-modal__participants-list');
         const modalParticipantsList = document.querySelector(participantModalSelector + ' .modal-participants__items');
         const participantsItems = document.querySelectorAll(participantModalSelector + ' .modal-participants__item');

         participantsList.innerHTML = '';

         allParticipants.forEach(participant => {
            const participantElement = document.createElement('div');
            participantElement.classList.add('modal-participants__item');

            participantElement.innerHTML = `
                  <div class="modal-participants__item-info">
                      <img src="${participant.imgSrc}" alt="">
                      <p>${participant.name}</p>
                  </div>`;

            participantElement.addEventListener('click', () => {
               if (!participantElement.classList.contains('active')) {
                  participantsItems.forEach(item => {
                     item.classList.remove('active');
                  });
                  participantElement.classList.add('active');

                  const selectedParticipant = document.createElement('li');
                  selectedParticipant.classList.add('video-chat-modal__participant');
                  selectedParticipant.innerHTML = `
                          <img src="${participant.imgSrc}" alt="">
                      `;

                  selectedParticipant.addEventListener('click', () => {
                     participantsList.removeChild(selectedParticipant);
                     participantElement.classList.remove('active');
                     const index = selectedParticipants.findIndex(p => p.name === participant.name);
                     if (index !== -1) {
                        selectedParticipants.splice(index, 1);
                     }
                  });

                  participantsList.appendChild(selectedParticipant);

                  const index = selectedParticipants.findIndex(p => p.name === participant.name);
                  if (index === -1) {
                     selectedParticipants.push(participant);
                  }
               } else {
                  participantElement.classList.remove('active');
                  const selectedParticipant = document.querySelector(`.video-chat-modal__participant img[src="${participant.imgSrc}"]`);
                  if (selectedParticipant) {
                     participantsList.removeChild(selectedParticipant.parentElement);
                     const index = selectedParticipants.findIndex(p => p.name === participant.name);
                     if (index !== -1) {
                        selectedParticipants.splice(index, 1);
                     }
                  }
               }
            });

            modalParticipantsList.appendChild(participantElement);
         });
      }

      // Working with participants
      const meetingsData = [];

      function addMeetingItem(data) {
         const newMeetingItem = document.createElement('div');
         newMeetingItem.classList.add('meetings-block__item', 'meetings-item');

         const startDateTime = new Date(`${data.date}T${data.startTime}`);
         const now = new Date();

         const timeDiff = startDateTime - now;
         const minutesDiff = Math.floor(timeDiff / (1000 * 60));

         let startsIn;

         if (minutesDiff > 0) {
            if (minutesDiff > 60) {
               const hoursDiff = Math.floor(minutesDiff / 60);
               startsIn = `Starts in ${hoursDiff} ${hoursDiff > 1 ? 'hours' : 'hour'}`;
            } else {
               startsIn = `Starts in ${minutesDiff} ${minutesDiff > 1 ? 'mins' : 'min'}`;
            }
         } else {
            startsIn = 'Meeting has started';
         }

         newMeetingItem.innerHTML = `
              <div class="meetings-item__top">
                  <h4 class="meetings-item__title">${data.meetingTitle}</h4>
                  <div class="meetings-item__start">${startsIn}</div>
              </div>
              <div class="meetings-item__info">
                  <div class="meetings-item__info-item">
                      <div class="meetings-item__info-title">Date & Time</div>
                      <div class="meetings-item__info-text">${data.date} - ${data.startTime} to ${data.endTime}</div>
                  </div>
                  <div class="meetings-item__info-item">
                      <div class="meetings-item__info-title">Meeting ID</div>
                      <div class="meetings-item__info-text">${data.meetingID}</div>
                  </div>
                  <div class="meetings-item__info-item">
                      <div class="meetings-item__info-title">Host</div>
                      <div class="meetings-item__info-text">${data.host}</div>
                  </div>
              </div>
              <div class="meetings-item__link">
                  <div class="meetings-item__link-title">Link</div>
                  <a href="#">Link to Meeting</a>
              </div>
          `;

         const meetingsBlock = document.querySelector('.meetings-block__items');
         meetingsBlock.appendChild(newMeetingItem);
      }

      function getMeetingFormData() {
         const meetingTitle = document.querySelector('.video-chat-modal__input.meeting-title').value;
         const timezone = document.getElementById('timezone-select').value;
         const date = document.querySelector('.video-chat-modal__input[type="date"]').value;
         const startTime = document.querySelector('.video-chat-modal__inputs input[type="time"]').value;
         const endTime = document.querySelector('.video-chat-modal__inputs input[type="time"]:last-of-type').value;
         const reminderValue = document.querySelector('.video-chat-modal__counter-input').value;
         const reminderUnit = document.querySelector('.video-chat-modal__select').value;
         const reminder = `${reminderValue} ${reminderUnit}`;
         const meetingID = Math.floor(Math.random() * 1000000);
         const alwaysJoin = document.getElementById('general-chbx-1').checked;
         const muteParticipants = document.getElementById('general-chbx-2').checked;
         const host = 'Current User';

         return {
            meetingTitle,
            timezone,
            date,
            startTime,
            endTime,
            reminder,
            selectedParticipants,
            alwaysJoin,
            muteParticipants,
            meetingID,
            host
         };
      }

      // Call page //

      // Copy Button Functionality
      const copyButton2 = document.getElementById("call-page-copy-button");
      if (copyButton2) {
         copyButton2.addEventListener('click', function () {
            const copyText = document.getElementById("call-page-link").textContent;
            copyTextToClipboard(copyText);
            copyButton2.disabled = true;
            const originalButtonText = copyButton2.innerHTML;
            copyButton2.innerHTML = `<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10.0007 15.1709L19.1931 5.97852L20.6073 7.39273L10.0007 17.9993L3.63672 11.6354L5.05093 10.2212L10.0007 15.1709Z" fill="#3B82F6"/>
                 </svg>
                 Copied!
                 `;

            setTimeout(function () {
               copyButton2.disabled = false;
               copyButton2.innerHTML = originalButtonText;
            }, 2000);
         });
      }

      // Form Settings Functionality
      const formSettings = document.getElementById('settings-modal-form');
      if (formSettings) {
         formSettings.addEventListener('submit', settingsFormSend);
         formSettings.addEventListener('reset', () => formReset(formSettings, '#settings-modal'));
      }
      // Settings Form Send Function
      async function settingsFormSend(e) {
         e.preventDefault();
         const error = formValidate(formSettings);
         if (error === 0) {
            formReset(formHostMeeting, '#settings-modal');
         }
      }

      // Chat Tabs Functionality
      const tabs = document.querySelectorAll('.chat-tabs__button');
      const tabContents = document.querySelectorAll('.chat-tabs__body');
      if (tabs) {
         tabs.forEach(tab => {
            tab.addEventListener('click', () => {
               const tabId = tab.dataset.tab;

               tabs.forEach(t => t.classList.remove('active'));
               tab.classList.add('active');

               tabContents.forEach(content => content.style.display = 'none');
               document.getElementById(tabId).style.display = 'flex';
            });
         });
      }

      // Message Form Functionality
      const messageForm = document.getElementById('message-form');
      const messageInput = document.getElementById('message-input');
      const messagesContainer = document.getElementById('messages');
      const fileInput = document.getElementById('file-input');

      if (messageForm) {
         messageForm.addEventListener('submit', function (event) {
            event.preventDefault();
            sendMessage();
         });
      }

      if (messageInput) {
         messageInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
               event.preventDefault();
               sendMessage();
            }
         });
      }

      if (fileInput) {
         fileInput.addEventListener('change', function () {
            const selectedFile = fileInput.files[0];
            if (selectedFile) {
               messageInput.value = '';
               sendMessage(selectedFile);
            }
         });
      }

      function sendMessage(attachedFile) {
         const messageContent = messageInput.value.trim();
         const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

         if (messageContent !== '' || attachedFile) {
            const newMessage = document.createElement('div');
            newMessage.classList.add('chat-tabs__message', 'chat-tabs__message_outgoing', 'message-sender');

            let messageHTML = `
                 <div class="message-sender__info">
                     <div class="message-sender__info-row">
                         <div class="message-sender__info-left">
                             <button type="button" class="message-sender__more-button"></button>
                             <div class="message-sender__time">${currentTime}</div>
                         </div>
                         <div class="message-sender__name">Jack Murphy</div>
                     </div>
                     <div class="message-sender__image">
                         <img src="img/call-page/participants/jack-murphy.jpg" alt="Your Name">
                     </div>
                 </div>
             `;

            if (attachedFile) {
               const fileName = attachedFile.name;
               let fileSize;

               if (attachedFile.size > 1024 * 1024) {
                  fileSize = (attachedFile.size / (1024 * 1024)).toFixed(2) + 'MB';
               } else {
                  fileSize = (attachedFile.size / 1024).toFixed(2) + 'KB';
               }

               messageHTML += `
                     <div class="message-sender__file file-message loading">
                         <div class="file-message__wrapper">
                             <div class="file-message__icon"></div>
                             <div class="file-message__info">
                                 <a href="${URL.createObjectURL(attachedFile)}" download="${fileName}" class="file-message__name">${fileName}</a>
                                 <div class="file-message__size">${fileSize}</div>
                             </div>
                             <button type="button" class="file-message__remove"></button>
                         </div>
                         <div class="file-message__loading-wrapper">
                             <div class="file-message__loading"></div>
                         </div>
                     </div>
                 `;
            }

            if (messageContent !== '') {
               messageHTML += `<p class="message-sender__text">${messageContent}</p>`;
            }

            newMessage.innerHTML = messageHTML;
            messagesContainer.appendChild(newMessage);
            messageInput.value = '';

            if (attachedFile) {
               const loadingIndicator = newMessage.querySelector('.file-message__loading');
               let progress = 0;
               const interval = setInterval(function () {
                  progress += 1;
                  loadingIndicator.style.width = `${progress}%`;
                  if (progress >= 100) {
                     clearInterval(interval);
                     newMessage.querySelector('.file-message').classList.remove('loading');
                     setTimeout(function () {
                        newMessage.querySelector('.file-message__loading-wrapper').remove();
                     }, 500);
                  }
               }, 20);
            }

            const removeButton = newMessage.querySelector('.file-message__remove');
            if (removeButton) {
               removeButton.addEventListener('click', function () {
                  newMessage.remove();
               });
            }

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
         }
      }

      // Meeting Participants Data
      const meetingParticipants = [
         { name: "You", imgSrc: "img/call-page/participants/jack-murphy.jpg" },
         { name: "Sen Do", imgSrc: "" },
         { name: "Jessie Cooper", imgSrc: "img/call-page/participants/jessie-cooper.jpg" },
         { name: "Simalakamut", imgSrc: "img/call-page/participants/simalakamut.jpg" },
         { name: "Raina", imgSrc: "img/call-page/participants/02.jpg" },
      ];

      // Render Meeting Participants
      const meetingParticipantsContainer = document.querySelector('.chat-participants');
      if (meetingParticipantsContainer) {
         meetingParticipants.forEach(participant => {
            const isYou = participant.name === "You";
            const micButtonContent = isYou ? '<button type="button" class="chat-participants__button-mic my-mic-button"></button>' : '<span class="chat-participants__button-mic"></span>';
            const camButtonContent = isYou ? '<button type="button" class="chat-participants__button-vid my-cam-button"></button>' : '<span class="chat-participants__button-vid"></span>';

            const participantItemHTML = `
               <div class="chat-participants__item">
                   <div class="chat-participants__item-left">
                       <div class="chat-participants__image">
                           ${participant.imgSrc !== ""
                  ?
                  `<img src="${participant.imgSrc}" alt="">`
                  :
                  `<div class="default-avatar">${participant.name[0]}</div>`}
                       </div>
                       <div class="chat-participants__name">${participant.name}</div>
                       <div class="chat-participants__hand-icon"></div>
                   </div>
                   <div class="chat-participants__item-right">
                       ${micButtonContent}
                       ${camButtonContent}
                   </div>
               </div>
           `;

            meetingParticipantsContainer.innerHTML += participantItemHTML;
         });
      }

      // Mic, Camera, Hand and Chat Buttons Functionality
      const myMicButtons = document.querySelectorAll('.my-mic-button');
      const myCameraButtons = document.querySelectorAll('.my-cam-button');
      const myVideo = document.querySelector('.call-participants__big-item');
      const handButton = document.querySelector('.call-page__button_hand');
      const handIcon = document.querySelector('.chat-participants__hand-icon');
      const chatButton = document.querySelector('.call-page__button_chat');

      if (myMicButtons) {
         myMicButtons.forEach(myMicButton => {
            myMicButton.addEventListener('click', () => {
               myMicButtons.forEach(button => button.classList.toggle('mic-off'));
            });
         });
      }

      if (myCameraButtons) {
         myCameraButtons.forEach(myCameraButton => {
            myCameraButton.addEventListener('click', () => {
               myCameraButtons.forEach(button => {
                  button.classList.toggle('cam-off')
               })
               myVideo.classList.toggle('camera-off')
            });
         });
      }

      if (handButton && handIcon) {
         handButton.addEventListener('click', () => handIcon.classList.toggle('raise'))
      }

      if (chatButton) {
         document.addEventListener("click", function (e) {
            if (e.target.closest('.call-page__button_chat')) {
               document.querySelector('.call-page__chat').classList.toggle("open");
            } else if (!e.target.closest('.call-page__chat')) {
               document.querySelector('.call-page__chat').classList.remove("open");
            }
         });
      }
   });
})();