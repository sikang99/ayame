// Signalling server URL setting
const isSSL = location.protocol === 'https:';
const wsProtocol = isSSL ? 'wss://' : 'ws://';

let wsUrl = wsProtocol + location.host + '/signal';
if (!location.host) {
  wsUrl = 'wss://ayame.shiguredo.jp/signaling';
}
document.getElementById("url").value = wsUrl;
const roomStorageKey = "OPEN-AYAME-SAMPLE-ROOM-IDS";
const roomInput = document.getElementById("roomId");
const recentRoomDiv = document.getElementById("recent-rooms");
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const connectButton = document.getElementById('connect-button');
const disconnectButton = document.getElementById('disconnect-button');

let connection = null;
let localStream = null;
let roomId = "agilertc"; //= randomString(9);
setRoomId(roomId);
let roomIds = [];

// connection processing
async function connect() {
  if (!connection) {
    if (localStream == null) {
      await startVideo();
    }
    roomId = document.getElementById("roomId").value;
    connectButton.disabled = true;
    disconnectButton.disabled = false;
    if (roomId.length < 2 || !roomId){
      alert("Please set Room ID");
      return;
    }
    let newRoomIds = [];
    if(roomIds.length > 0 && roomId === roomIds[0]) {
      newRoomIds = [...roomIds];
    } else {
      newRoomIds = [roomId, ...roomIds];
    }
    localStorage.setItem(roomStorageKey, JSON.stringify(newRoomIds));
    recentRoomDiv.style.display = 'none';
    
    // create ayame connection
    connection = window.Ayame.connection(wsUrl, roomId);
    connection.on('disconnect', (e) => {
      connectButton.disabled = false;
      disconnectButton.disabled = true;
    });
    connection.on('addstream', (e) => {
      console.log(e.stream);
      playVideo(remoteVideo, e.stream);
    });
    connection.connect(localStream);
  }
}

// disconnect processing
async function disconnect(){
  if(connection) {
    connectButton.disabled = false;
    disconnectButton.disabled = true;
    recentRoomDiv.style.display = 'block';
    loadLocalRoomIds();
    await connection.disconnect();
    localStream = null;
    connection = null;
  }
}

// change ws url
function onChangeWsUrl() {
  wsUrl = document.getElementById("url").value;
  console.log('ws url changes', wsUrl);
}

// change room id
function onChangeRoomId() {
  roomId = roomInput;
  console.log('room id changes', roomId);
}

// local stream を video element set
async function startVideo() {
  disconnectButton.disabled = true;

  var noiseConstraints = {
    video: true,
    audio: {
      optional: [
        {echoCancellation: true},
        {mozAutoGainControl: true},
        {mozNoiseSuppression: true},
        {googEchoCancellation: true},
        {googAutoGainControl: true},
        {googNoiseSuppression: true},
        {googHighpassFilter: true}
      ]
    }
  };
  localStream = await navigator.mediaDevices.getUserMedia(noiseConstraints);
  playVideo(localVideo, localStream);
}

async function playVideo(element, stream) {
  element.srcObject = stream;
  try {
    await element.play();
  } catch(error) {
    console.log('error auto play:' + error);
  }
}

// generarte numeric string
function randomString(strLength) {
  var result = [];
  strLength = strLength || 5;
  var charSet = '0123456789';
  while (strLength--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return result.join('');
}

// set room id
function setRoomId(id) {
  roomId = id;
  roomInput.value = roomId;
}

function loadLocalRoomIds() {
  const roomUl = document.getElementById('recent-item-list');
  const itemJSON = localStorage.getItem(roomStorageKey);
  
  if (itemJSON) {
    roomIds = JSON.parse(itemJSON).slice(0, 7);
  }

  const fragment = document.createDocumentFragment();
  roomUl.innerHTML = '';
  roomIds.forEach(r => {
    const roomLi = document.createElement('li');
    roomLi.id = 'recent-items-' + roomId;
    roomLi.innerHTML = `<a onclick="setRoomId(${r})">${r}</a>`;
    fragment.appendChild(roomLi);
  });

  roomUl.appendChild(fragment);
}


loadLocalRoomIds();
startVideo();
