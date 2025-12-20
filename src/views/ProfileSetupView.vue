<template>
  <div class="welcome-wrap">
    <div class="setup-card">
      <h1>JBNU Game Platform</h1>
      <p class="subtitle">프로필을 설정해주세요</p>

      <div class="form-box">
        <div class="form-group">
          <label>닉네임</label>
          <input v-model="nickname" placeholder="닉네임 입력" />
        </div>

        <div class="form-group">
          <label>학과</label>
          <select v-model="major">
            <option disabled value="">학과 선택</option>
            <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>학번</label>
          <select v-model="year">
            <option disabled value="">학번 선택</option>
            <option v-for="y in yearList" :key="y" :value="y">{{ y }}학번</option>
          </select>
        </div>

        <button class="btn-enter" @click="enter" :disabled="!canEnter">입장하기</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// 라우터
const router = useRouter();

// 선택 옵션들
const majors = ["컴퓨터공학부", "소프트웨어공학과", "전자공학과", "컴퓨터인공지능학부"];
// 🔥 [FIX] 00 ~ 25 학번 생성
const yearList = Array.from({ length: 26 }, (_, i) => i.toString().padStart(2, '0'));

// 사용자 입력
const major = ref("");
const year = ref("");
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
      year: parseInt(year.value), // 저장할 때는 숫자로
      nickname: nickname.value,
      email: user.email,
      money: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    router.push("/platform");
  });
}
</script>

<style scoped>
.welcome-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #121212;
  color: white;
}

.setup-card {
  background: #1e1e2e;
  padding: 40px;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #fff;
  font-weight: 700;
}

.subtitle {
  color: #aaa;
  margin-top: 8px;
  font-size: 0.9rem;
}

.form-box {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 0.9rem;
  font-weight: 600;
}

select,
input {
  width: 100%;
  padding: 12px;
  background: #2a2a3a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

select:focus,
input:focus {
  border-color: #4CAF50;
  outline: none;
}

.btn-enter {
  margin-top: 10px;
  padding: 14px;
  border: none;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.btn-enter:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.btn-enter:disabled {
  background: #444;
  color: #888;
  cursor: not-allowed;
}
</style>
