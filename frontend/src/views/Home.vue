<template>
  <div class="container max-w-2xl mx-auto flex flex-col p-5 mt-12">
    <div v-if="screen == 'in_class'">
      <div class="mb-4 text-center">
        <h3 class="font-medium text-5xl">
          <i class="fas fa-check"></i> You're in {{ name }}!
        </h3>
        <h4 class="text-xl mt-2">
          <i class="fas fa-video"></i> Leave this tab open and return to your
          meet
        </h4>
      </div>
      <video
        autoplay
        muted
        width="720"
        height="560"
        class="rounded-lg bg-gray-700 border-gray-700 border-4"
        style="transform: rotateY(180deg)"
        ref="vid_ref"
      />
      <p class="text-center font-medium text-3xl mt-4">
        <i class="fas fa-smile-wink"></i> Current Emotion:
        {{ emoji_map[currentEmotion] }} {{ currentEmotion }}
      </p>
    </div>
    <div
      v-else
      class="rounded-lg border-2 p-5 hover:shadow-lg duration-200 mt-36"
    >
      <div class="mb-5 text-center">
        <h4 class="font-medium text-3xl">
          <i class="fas fa-sign-in-alt"></i> Join a Class
        </h4>
        <router-link
          class="font-medium text-lg cursor-pointer text-blue-700 mt-2"
          to="/host"
        >
          or Host a Class
        </router-link>
      </div>
      <input
        type="text"
        placeholder="Enter Class Code"
        class="input"
        v-model="class_code"
      />
      <input
        type="text"
        placeholder="Enter Name"
        class="input mt-5"
        v-model="name"
      />
      <button
        class="button bg-red-700 text-white mt-5 font-medium text-xl disabled:opacity-50"
        @click="joinClass"
        :disabled="!(name && class_code)"
      >
        Join Class <i class="fas fa-sign-in-alt"></i>
      </button>
    </div>
  </div>
</template>

<script>
/* eslint no-undef: 0 */
import io from "socket.io-client";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
export default {
  name: "Home",
  data: () => ({
    currentEmotion: "unknown",
    socket: null,
    screen: "pre_class",
    class_code: null,
    name: null,
    emoji_map: {
      neutral: "😐",
      happy: "😊",
      sad: "😟",
      angry: "😠",
      fearful: "😨",
      disgusted: "🤢",
      surprised: "😲",
      unknown: "❓",
    },
  }),
  created() {
    this.socket = io("http://10.0.1.9:8000");
    this.socket.on("kicked", () => {
      this.class_code = null;
      this.name = null;
      this.currentEmotion = "unknown";
      this.screen = "pre_class";
      alert("You have been kicked from the class");
    });
  },
  methods: {
    startVideo() {
      delay(1500);
      const video = this.$refs.vid_ref;
      navigator.getUserMedia(
        { video: true },
        (stream) => (video.srcObject = stream),
        (err) => console.log(err)
      );
      video.addEventListener("play", () => {
        setInterval(async () => {
          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          if (detection) {
            this.currentEmotion = this.getEmotion(detection.expressions);
            this.socket.emit("update_emotion", this.currentEmotion);
          } else {
            this.currentEmotion = "unknown";
            this.socket.emit("update_emotion", this.currentEmotion);
          }
        }, 200);
      });
    },
    initVideo() {
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ])
        .then(this.startVideo)
        .catch((err) => console.log(err));
    },
    getEmotion(emotions) {
      return Object.entries(emotions).sort((a, b) => b[1] - a[1])?.[0]?.[0];
    },
    joinClass() {
      this.socket.emit("join_class", {
        class_id: this.class_code,
        emotion: this.currentEmotion,
        name: this.name,
      });
      this.screen = "in_class";
      this.initVideo();
    },
  },
};
</script>
