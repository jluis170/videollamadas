import React from 'react'; 
import logo from './logo.svg';
import firebase from './firebase';
import './App.css';

let localStream = null;
let remoteStream = null;
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const db = firebase.firestore();
const pc = new RTCPeerConnection(servers);

function App() {

  const webcamButton = document.getElementById('webcamButton');
  const webcamVideo = document.getElementById('webcamVideo');
  const callButton = document.getElementById('callButton');
  const callInput = document.getElementById('callInput');
  const answerButton = document.getElementById('answerButton');
  const remoteVideo = document.getElementById('remoteVideo');
  const hangupButton = document.getElementById('hangupButton');

  const abrirCamara = async() =>{

    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true}); 

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    // Show stream in HTML video
    webcamVideo.srcObject = localStream;

    remoteStream = new MediaStream();

// Pull tracks from remote stream, add to video stream
  pc.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
      });
  };

  remoteVideo.srcObject = remoteStream;

  };

  const crearOferta = async() =>{

    // Reference Firestore collections for signaling
    const callDoc = db.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    callInput.value = callDoc.id;

    // Get candidates for caller, save to db
    pc.onicecandidate = event => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

      // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    answerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

  }

  const respuestaOferta = async() =>{

    const callId = callInput.value;
    const callDoc = db.collection('calls').doc(callId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    pc.onicecandidate = event => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    // Fetch data, then set the offer & answer

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    // Listen to offer candidates

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change)
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

  
  }

  return (
    <React.Fragment>
      <h2>Start your webcam</h2>
      <div className="videos">
        <span>
          <h3>Local</h3>
          <video id="webcamVideo" autoPlay playsInline></video>
        </span>
        <span>
          <h3>Remote</h3>
          <video id="remoteVideo" autoPlay playsInline></video>
        </span> 
      </div>

      <button onClick={abrirCamara} id="webcamButton">Start webcam</button>
      <h2>Create a new Call</h2>
      <button id="callButton" onClick={crearOferta}>Call</button>

      <h2>Join a call</h2>
      <input id="callInput"/>
      <button id="answerButton" onClick={respuestaOferta}>Answer</button>
      <button id="hangupButton">Hangup</button>


    </React.Fragment>
  );
}

export default App;
