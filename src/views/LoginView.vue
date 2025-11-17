<template>
  <div class="login-container">
    <h1>JBNU GAME</h1>

    <button @click="googleLogin" class="login-btn">
      Google 로그인
    </button>
  </div>
</template>

<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup,onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useRouter } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    await signInAnonymously(auth);
  }
});


const router = useRouter();
const provider = new GoogleAuthProvider();

async function googleLogin() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // 🔥 jbnu 이메일 체크


  // 🔍 DB에서 기존 프로필 존재 여부 체크
  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (snap.exists()) {
    // 이미 프로필 정보가 있는 사용자 → 플랫폼으로 이동
    router.push("/platform");
  } else {
    // 새로운 사용자 → 프로필 입력 페이지로 이동
    router.push("/profile-setup");
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}

.login-btn {
  padding: 12px 22px;
  border-radius: 8px;
  background: #4285f4;
  color: white;
  font-weight: bold;
  border: none;
  cursor: pointer;
}
</style>
