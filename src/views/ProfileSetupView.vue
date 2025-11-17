<template>
  <div class="welcome-wrap">
    <h1>JBNU Game Platform</h1>

    <div class="form-box">
      <label>학과 선택</label>
      <select v-model="major">
        <option disabled value="">학과 선택</option>
        <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
      </select>

      <label>입학년도 (학번)</label>
      <select v-model="year">
        <option disabled value="">입학년도 선택</option>
        <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
      </select>

      <label>닉네임</label>
      <input v-model="nickname" placeholder="닉네임 입력" />

      <button @click="enter" :disabled="!canEnter">입장하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { auth, db } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// 라우터
const router = useRouter();

// 선택 옵션들
const majors = ["컴퓨터공학부", "소프트웨어공학과", "전자공학과"];
const yearList = Array.from({ length: 15 }, (_, i) => 2010 + i);

// 사용자 입력
const major = ref("");
const year = ref<number | "">("");
const nickname = ref("");

// 3개 입력 완료해야 버튼 활성화
const canEnter = computed(() => {
  return (
    major.value !== "" &&
    year.value !== "" &&
    nickname.value.trim() !== ""
  );
});

// Firestore에 회원 정보 저장
async function enter() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("로그인된 유저 없음");
      return;
    }

    await setDoc(doc(db, "users", user.uid), {
      major: major.value,
      year: year.value,
      nickname: nickname.value,
      email: user.email,
      money: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    router.push("/platform");
  });
}

// money 최소값=1 유지하며 업데이트하는 함수
async function updateMoney(uid: string, newValue: number) {
  const safeValue = Math.max(1, newValue); // 절대 1 아래로 떨어지지 않음

  await updateDoc(doc(db, "users", uid), {
    money: safeValue,
    updatedAt: new Date(),
  });
}
</script>

<style scoped>
.welcome-wrap {
  max-width: 400px;
  margin: 80px auto;
  text-align: center;
}

.form-box {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

select,
input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #aaa;
}

button {
  margin-top: 20px;
  padding: 12px;
  border: none;
  background: #3f51b5;
  color: white;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  background: #aaa;
}
</style>
