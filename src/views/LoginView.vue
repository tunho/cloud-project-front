<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="logo-area">
        <div class="game-piece">♟️</div>
        <h1>JBNU GAME</h1>
        <p class="subtitle">전북대학교 보드게임 플랫폼</p>
      </div>

      <div class="action-area">
        <button @click="googleLogin" class="login-btn">
          <span class="icon">G</span>
          <span class="text">전북대 메일로 로그인</span>
        </button>
        <p class="info-text">@jbnu.ac.kr 계정만 사용 가능합니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// 백그라운드 연결 유지를 위한 익명 로그인 (UI는 구글 로그인에 집중)
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    await signInAnonymously(auth);
  }
});

const router = useRouter();
const provider = new GoogleAuthProvider();

async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // 🔥 jbnu 이메일 체크
    if (!user.email?.endsWith('@jbnu.ac.kr')) {
      await signOut(auth);
      alert('전북대학교 메일(@jbnu.ac.kr)로만 로그인할 수 있습니다.');
      return;
    }

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
  } catch (error) {
    console.error("Login failed", error);
  }
}
</script>

<style scoped>
/* Premium Game Theme Styles */

.login-wrapper {
  /* 화면 전체 덮기 설정 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  
  /* Flex 정렬 */
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* 배경 스타일 */
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: white;
  overflow: hidden;
}

.login-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3.5rem 3rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-piece {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-area h1 {
  font-size: 2.2rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(to right, #fff, #ccc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.subtitle {
  margin-top: 0.5rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.login-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: white;
  color: #333;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
  background: #f8f9fa;
}

.login-btn:active {
  transform: scale(0.98);
}

.icon {
  font-weight: 900;
  color: #4285f4;
}

.info-text {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}
</style>