<template>
  <div class="container max-w-3xl mx-auto flex flex-col p-5 mt-10">
    <div>
      <h4 class="text-center font-medium text-5xl mb-7">
        <i class="fas fa-chalkboard-teacher"></i> Host a Class
      </h4>
      <p class="font-medium text-2xl text-center">
        <i class="fas fa-keyboard"></i> Students join using the class code:
        <span class="text-red-600">{{ showCode ? class_code : "hidden" }}</span>
        <a
          @click="showCode = !showCode"
          class="ml-2 text-blue-600 cursor-pointer text-lg"
          >{{ showCode ? "hide" : "show" }}</a
        >
      </p>
      <div class="mt-6">
        <p class="text-center font-medium text-2xl mb-1">
          <i class="fas fa-smile-wink"></i> Current Student Emotions
        </p>
        <canvas
          class="rounded-lg border-gray-700 border-4 p-3"
          ref="user_chart"
        ></canvas>
      </div>
      <div class="mt-8">
        <p class="text-center font-medium text-2xl mb-1">
          <i class="fas fa-users"></i> Connected Students ({{
            students.length
          }})
        </p>
        <table
          class="border-4 border-collapse rounded w-full border-green-700 text-xl"
          v-if="students.length"
        >
          <thead>
            <tr class="bg-green-100">
              <th><i class="fas fa-id-badge"></i> Id</th>
              <th><i class="fas fa-signature"></i> Name</th>
              <th><i class="fas fa-smile-wink"></i> Current Emotion</th>
              <th><i class="fas fa-user-times"></i> Kick</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td>{{ student.id }}</td>
              <td>{{ student.name }}</td>
              <td>{{ emoji_map[student.emotion] }} {{ student.emotion }}</td>
              <td
                class="text-red-500 cursor-pointer"
                @click="kickStudent(student.id)"
              >
                Kick
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<style scoped lang="postcss">
td,
th {
  @apply border-2 border-green-600 p-3;
}
</style>
<script>
/* eslint no-undef: 0 */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
export default {
  name: "Host",
  data: () => ({
    class_code: null,
    students: [],
    user_chart: null,
    socket: null,
    showCode: true,
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
    this.class_code = uuidv4().substring(24, 30);
    this.socket.emit("create_class", this.class_code);
    this.socket.on("student_joined", (student) => {
      this.students.push(student);
      this.user_chart.update("reset");
    });
    this.socket.on("student_left", (student_id) => {
      this.students = this.students.filter(
        (student) => student.id != student_id
      );
    });
    this.socket.on("emotion_updated", (data) => {
      this.students.forEach((student) => {
        if (student.id == data.id) {
          student.emotion = data.emotion;
          return;
        }
      });
      this.user_chart.data.datasets[0].data = this.cData(this.students);
      this.user_chart.update();
    });
  },
  mounted() {
    this.initChart();
  },
  watch: {
    students(newVal) {
      this.user_chart.data.datasets[0].data = this.cData(newVal);
      this.user_chart.update();
    },
  },
  methods: {
    kickStudent(student_id) {
      this.students = this.students.filter(
        (student) => student.id != student_id
      );
      this.socket.emit("kick_student", student_id);
    },
    cData(students) {
      const d = {
        neutral: 0,
        happy: 0,
        sad: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        surprised: 0,
        unknown: 0,
      };
      students.forEach((student) => {
        d[student.emotion]++;
      });
      return d;
    },
    initChart() {
      delay(3000);
      this.user_chart = new Chart(this.$refs.user_chart.getContext("2d"), {
        type: "bar",
        data: {
          labels: [
            "neutral",
            "happy",
            "sad",
            "angry",
            "fearful",
            "disgusted",
            "surprised",
            "unknown",
          ],
          datasets: [
            {
              label: "# of Students",
              data: {},
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scale: {
            ticks: {
              precision: 0,
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: false,
            },
          },
        },
      });
    },
  },
};
</script>
