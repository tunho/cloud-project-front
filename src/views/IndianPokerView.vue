<template>
  <div class="poker-container-premium">
    <!-- 🔥 VS Screen Overlay -->
    <VsScreen 
        v-if="showVsScreen" 
        :player1="me" 
        :player2="opponent" 
        @finish="handleVsScreenFinish" 
    />

    <!-- ℹ️ Player Info Modal -->
    <PlayerInfoModal
        v-if="showPlayerInfoModal"
        :isOpen="showPlayerInfoModal"
        :player="selectedPlayerInfo"
        @close="showPlayerInfoModal = false"
    />

    <!-- 🔥 Exit Button -->
    <button class="exit-btn" @click="leaveGame">
        <span class="icon">🚪</span> 나가기
    </button>

    <!-- 🕊️ Flying Objects Container -->
    <div class="flying-container">
        <div 
            v-for="obj in flyingObjects" 
            :key="obj.id" 
            class="flying-element"
            :class="obj.type"
            :style="{ 
                left: obj.x + 'px', 
                top: obj.y + 'px',
                transition: `all ${obj.duration}ms ease-in-out`
            }"
        >
            <div v-if="obj.type === 'card'" class="flying-card-back"></div>
            <div v-if="obj.type === 'chip'" class="flying-chip">🪙</div>
        </div>
    </div>
</div>

    <!-- 🔢 Round Indicator -->
    <div class="round-indicator" :class="{ 'hidden': showVsScreen }">
        ROUND <span class="round-num">{{ currentRound }}</span> <span class="max-round">/ 10</span>
    </div>

    <!-- 🔴 Opponent Area -->
    <div class="player-area opponent" ref="opponentAreaRef">
        <div class="player-card-wrapper">
            <div class="player-card" :class="{ 'active-turn': currentTurnUid === opponent?.uid }">
                <div class="avatar-container" ref="opponentAvatarRef">
                    <CharacterAvatar 
                        v-if="opponent?.character" 
                        v-bind="opponent.character" 
                        :size="80" 
                        mode="face" 
                    />
                    <div v-else class="avatar-placeholder">{{ opponent?.nickname?.[0] || '?' }}</div>
                </div>
                <div class="player-info">
                    <div class="nickname">{{ opponent?.nickname || 'Waiting...' }}</div>
                    <div class="stake"><span class="bet-icon">⛃</span> {{ (opponent?.entryBet || 10000).toLocaleString() }}</div>
                    <div class="chips-container">
                        <div class="chip-stack">
                            <div v-for="n in Math.min(5, Math.ceil(opponentChips / 1000))" :key="n" class="chip" :style="{ bottom: `${n * 2}px` }"></div>
                        </div>
                        <div class="chips-text">{{ opponentChips.toLocaleString() }}</div>
                    </div>
                    <div class="bet" v-if="opponentBet > 0">Bet: {{ opponentBet }}</div>
                </div>
                <!-- Timer Bar -->
                <div class="timer-bar-container" v-if="currentTurnUid === opponent?.uid">
                    <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
                </div>
            </div>
            <!-- 👁️ Profile Button (Opponent) -->
            <button class="profile-view-btn" @click.stop="viewProfile(opponent)">
                👁️
            </button>
        </div>
    </div>

    <!-- 🃏 Opponent Card (Absolute) -->
    <div class="poker-card opponent-card" ref="opponentCardRef" :class="{ 'revealed': opponentCard && opponentCard !== 'HIDDEN', 'invisible': !cardsDealt, 'winner-card': winnerUid === opponent?.uid && phase === 'SHOWDOWN' }">
        <div class="card-inner">
            <div class="card-front">
                <div class="card-value">{{ opponentCard }}</div>
                <div class="card-suit">♠</div>
            </div>
            <div class="card-back">
                <div class="pattern"></div>
            </div>
        </div>
    </div>

    <!-- 🃏 My Card (Absolute) -->
    <div class="poker-card my-card" ref="myCardRef" :class="{ 'my-turn': isMyTurn, 'revealed': myCard && myCard !== 'HIDDEN', 'invisible': !cardsDealt, 'winner-card': winnerUid === me?.uid && phase === 'SHOWDOWN' }">
        <div class="card-inner">
            <div class="card-front">
                <div class="card-value">{{ myCard }}</div>
                <div class="card-suit">♥</div>
            </div>
            <div class="card-back">
                <div class="pattern"></div>
            </div>
        </div>
    </div>

    <!-- 🟡 Pot and Action UI (Centered) -->
    <div class="pot-container">
        <div class="pot-display" ref="potRef">
            <div class="pot-label">POT</div>
            <div class="pot-value">
                <span class="coin-icon">🪙</span>
                {{ displayedPot.toLocaleString() }}
            </div>
        </div>
    </div>

    <!-- 📢 Action Indicator (Unified Position) -->
    <div class="action-indicator" v-if="lastAction" :class="{'me': lastAction.uid === me?.uid, 'opponent': lastAction.uid !== me?.uid}">
        <div class="action-text">
            {{ 
                lastAction.bet_label ? lastAction.bet_label : 
                (lastAction.action === 'CALL' && lastAction.amount === 0) ? 'CHECK' : 
                (lastAction.action === 'FOLD' || lastAction.action === 'DIE') ? 'DIE' : 
                lastAction.action 
            }}
        </div>
        <div class="action-amount" v-if="lastAction.amount > 0 && lastAction.action !== 'FOLD' && lastAction.action !== 'DIE'">+{{ lastAction.amount.toLocaleString() }}</div>
    </div>



    <!-- 📊 Chip Comparison Overlay (Before Game Over) -->
    <div v-if="isCheckingWinner" class="chip-comparison-overlay">
        <div class="comparison-content">
            <div class="comp-title">FINAL CHIP COUNT</div>
            <div class="comp-players">
                <div class="comp-player me" :class="{'winner': (myChips > opponentChips)}">
                    <div class="comp-avatar-wrapper">
                        <CharacterAvatar v-if="me?.character" v-bind="me.character" :size="100" mode="face" :isWinner="myChips > opponentChips" />
                    </div>
                    <div class="comp-name">{{ me?.nickname || 'Me' }}</div>
                    <div class="comp-chips">{{ myChips.toLocaleString() }}</div>
                </div>
                <div class="comp-vs">VS</div>
                <div class="comp-player opponent" :class="{'winner': (opponentChips > myChips)}">
                    <div class="comp-avatar-wrapper">
                        <CharacterAvatar v-if="opponent?.character" v-bind="opponent.character" :size="100" mode="face" :isWinner="opponentChips > myChips" />
                    </div>
                    <div class="comp-name">{{ opponent?.nickname || 'Opponent' }}</div>
                    <div class="comp-chips">{{ opponentChips.toLocaleString() }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- 📢 Notification Overlay (New) -->
    <div v-if="notificationMessage" class="notification-overlay">
        <div class="notification-content">
            {{ notificationMessage }}
        </div>
    </div>

    <!-- 🏁 Game Over Overlay (Omok Style) -->
    <div v-if="gameOver" class="game-over-overlay">
        <div class="result-card" :class="{ victory: amIWinner, defeat: !amIWinner }">
            <div class="result-icon">{{ amIWinner ? '🏆' : '🏁' }}</div>
            <h2>{{ amIWinner ? 'VICTORY' : 'DEFEAT' }}</h2>
            
            <div class="winner-announce">
                <div class="winner-avatar">
                    <CharacterAvatar v-if="winner?.character" v-bind="winner.character" :size="100" mode="face" />
                    <div v-else class="avatar-placeholder big" style="width: 100px; height: 100px; font-size: 3rem;">
                        {{ winner?.nickname?.[0] || '?' }}
                    </div>
                </div>
                <div class="winner-text">
                    Winner: <span class="winner-name">{{ winner?.nickname || 'Unknown' }}</span>
                </div>
                <!-- 🔥 Reason removed from final UI as requested -->
            </div>
            
            <div class="payout-list" v-if="payouts.length > 0">
                <div v-for="p in payouts" :key="p.uid" class="payout-item" :class="{ 'winner': p.rank === 1, 'loser': p.rank > 1 }">
                    <div class="p-info">
                        <span class="p-rank">{{ p.rank === 1 ? '🥇' : '💀' }}</span>
                        <span class="p-name">{{ p.nickname }}</span>
                    </div>
                    <div class="p-result">
                        <span class="p-change" :class="p.net_change > 0 ? 'plus' : 'minus'">
                            {{ p.net_change > 0 ? '+' : '' }}{{ p.net_change.toLocaleString() }}
                        </span>
                        <span class="p-total">
                            (Total: {{ p.new_total.toLocaleString() }})
                        </span>
                    </div>
                </div>
            </div>

            <button class="home-btn" @click="goHome">Lobby</button>
        </div>
    </div>

    <!-- 🔵 My Area -->
    <div class="player-area me" ref="myAreaRef">
        <div class="player-card-wrapper">
            <div class="player-card" :class="{ 'active-turn': isMyTurn }">
                <div class="avatar-container" ref="myAvatarRef">
                    <CharacterAvatar 
                        v-if="me?.character" 
                        v-bind="me.character" 
                        :size="80" 
                        mode="face" 
                    />
                    <div v-else class="avatar-placeholder">{{ me?.nickname?.[0] || 'M' }}</div>
                </div>
                <div class="player-info">
                    <div class="nickname">{{ me?.nickname || 'Me' }}</div>
                    <div class="stake"><span class="bet-icon">⛃</span> {{ (me?.entryBet || 10000).toLocaleString() }}</div>
                     <div class="chips-container">
                        <div class="chip-stack">
                            <div v-for="n in Math.min(5, Math.ceil(myChips / 1000))" :key="n" class="chip" :style="{ bottom: `${n * 2}px` }"></div>
                        </div>
                        <div class="chips-text">{{ myChips.toLocaleString() }}</div>
                    </div>
                    <div class="bet" v-if="myBet > 0">Bet: {{ myBet }}</div>
                    <!-- Timer Bar -->
                    <div class="timer-bar-container" v-if="isMyTurn">
                        <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
                    </div>
                </div>
            </div>
            <!-- 👁️ Profile Button (Me) -->
            <button class="profile-view-btn" @click.stop="viewProfile(me)">
                👁️
            </button>
        </div>
    </div>

    <!-- 🎮 Controls (Absolute Bottom) -->
    <div class="controls" v-if="phase === 'BETTING'">
        <div class="control-row">
            <button class="action-btn fold" @click="doAction('FOLD')" :disabled="!isMyTurn">
                <div class="btn-label">다이</div>
                <div class="btn-amount">Give Up</div>
            </button>
            
            <button v-if="callAmount === 0" class="action-btn check" @click="doAction('CALL')" :disabled="!isMyTurn">
                <div class="btn-label">체크</div>
                <div class="btn-amount">0</div>
            </button>
            <button v-else class="action-btn call" @click="doAction('CALL')" :disabled="!isMyTurn || myChips === 0">
                <div class="btn-label">콜</div>
                <div class="btn-amount">{{ Math.min(myChips, callAmount).toLocaleString() }}</div>
            </button>
        </div>

        <div class="control-row" v-if="canRaise">
            <button class="action-btn raise" @click="doAction('RAISE', quarterAmount, 'QUARTER')" :disabled="!isMyTurn || myChips < (callAmount + quarterAmount)">
                <div class="btn-label">쿼터</div>
                <div class="btn-amount">{{ (callAmount + quarterAmount).toLocaleString() }}</div>
            </button>
            <button class="action-btn raise" @click="doAction('RAISE', halfAmount, 'HALF')" :disabled="!isMyTurn || myChips < (callAmount + halfAmount)">
                <div class="btn-label">하프</div>
                <div class="btn-amount">{{ (callAmount + halfAmount).toLocaleString() }}</div>
            </button>
            <button class="action-btn raise" @click="doAction('RAISE', fullAmount, 'FULL')" :disabled="!isMyTurn || myChips < (callAmount + fullAmount)">
                <div class="btn-label">풀</div>
                <div class="btn-amount">{{ (callAmount + fullAmount).toLocaleString() }}</div>
            </button>
            <button class="action-btn allin" @click="doAction('ALLIN', 0, 'MAX')" :disabled="!isMyTurn">
                <div class="btn-label">맥스</div>
                <div class="btn-amount">{{ myChips.toLocaleString() }}</div>
            </button>
        </div>
    </div>



</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { socket } from '../socket';
import { useRouter, useRoute } from 'vue-router';
import { auth } from '../firebase';
import VsScreen from '../components/game/VsScreen.vue';
import CharacterAvatar from '../components/CharacterAvatar.vue';
import PlayerInfoModal from '../components/game/PlayerInfoModal.vue';

interface Player {
    uid: string;
    nickname: string;
    character?: any;
    entryBet?: number;
    money: number;
    major?: string;
    year?: number;
    // Fields required by PlayerInfoModal
    id: number;
    name: string;
}

const router = useRouter();
const route = useRoute();
const roomId = route.params.roomId;

// --- Refs for Animation ---
const myAreaRef = ref<HTMLElement | null>(null);
const opponentAreaRef = ref<HTMLElement | null>(null);
const myCardRef = ref<HTMLElement | null>(null);
const opponentCardRef = ref<HTMLElement | null>(null);
const myAvatarRef = ref<HTMLElement | null>(null);
const opponentAvatarRef = ref<HTMLElement | null>(null);
const potRef = ref<HTMLElement | null>(null);

// --- State ---
const socketId = ref(socket.id);
const isConnected = ref(socket.connected);
const players = ref<any[]>([]);
const currentRound = ref(0);
const pot = ref(0);
const displayedPot = ref(0);
const chips = ref<any>({});
const currentBets = ref<any>({});
const phase = ref('BETTING');
const hands = ref<any>({});
const currentTurnUid = ref('');
const lastAction = ref<any>(null); // 🔥 Restored missing state
const isCheckingWinner = ref(false);
const pendingFinalChips = ref<Record<string, number> | null>(null); // 🔥 Store final chips for animation
const notificationMessage = ref(''); // 🔥 New state for game over notification
const gameOver = ref(false);
const winnerUid = ref<string | null>(null);
const showVsScreen = ref(false);

// Game Over State
const winner = ref<any>(null);
const payouts = ref<any[]>([]);
const gameOverReason = ref<string>('normal');

// Timer State
const timeLeft = ref(30);
const maxTime = ref(30);
let timerInterval: number | null = null;

// Animation State
const cardsDealt = ref(false);
const flyingObjects = ref<any[]>([]);
const showActionToast = ref(false);
const actionToastPlayer = ref('');
const actionToastMessage = ref('');

// Player Info Modal
const showPlayerInfoModal = ref(false);
const selectedPlayerInfo = ref<Player | null>(null);

function viewProfile(player: any) {
    console.log("🔍 [ViewProfile] Player Data:", player); // 🔥 Debug Log
    if (!player) return;
    // Map fields to satisfy PlayerInfoModal's Player interface
    // id is required by Modal but we might only have uid. Use a dummy or hash if needed.
    // name is required, map nickname to it.
    const playerForModal: Player = { 
        uid: player.uid,
        nickname: player.nickname,
        character: player.character,
        entryBet: player.entryBet,
        money: player.money ?? 0, // Use nullish coalescing and ensure number
        major: player.major || '-',
        year: player.year || 0,
        id: player.id || 0,
        name: player.nickname || player.name || 'Unknown'
    };
    selectedPlayerInfo.value = playerForModal;
    showPlayerInfoModal.value = true;
}

// --- Computed ---
const me = computed(() => {
    const myUid = auth.currentUser?.uid;
    if (myUid) {
        const p = players.value.find(p => p.uid === myUid);
        if (p) return p;
    }
    return players.value[0] || null;
});

const opponent = computed(() => {
    const myUid = auth.currentUser?.uid;
    if (myUid) {
        const p = players.value.find(p => p.uid !== myUid);
        if (p) return p;
    }
    return players.value[1] || null;
});

const myChips = computed(() => chips.value[me.value?.uid] || 0);
const opponentChips = computed(() => chips.value[opponent.value?.uid] || 0);
const myBet = computed(() => currentBets.value[me.value?.uid] || 0);
const opponentBet = computed(() => currentBets.value[opponent.value?.uid] || 0);
const myCard = computed(() => hands.value[me.value?.uid]);
const opponentCard = computed(() => hands.value[opponent.value?.uid]);
const isMyTurn = computed(() => me.value?.uid === currentTurnUid.value);

const amIWinner = computed(() => {
    if (!winner.value) return false;
    return winner.value.uid === auth.currentUser?.uid;
});

const callAmount = computed(() => {
    const maxBet = Math.max(myBet.value, opponentBet.value);
    return maxBet - myBet.value;
});



const winnerPlayer = computed(() => {
    if (!winnerUid.value) return null;
    return players.value.find(p => p.uid === winnerUid.value);
});

// Watch pot for animation
watch(pot, (newVal, oldVal) => {
    animatePot(oldVal, newVal);
});

function animatePot(start: number, end: number) {
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4);
        
        displayedPot.value = Math.floor(start + (end - start) * ease);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

const potBase = computed(() => pot.value);

const quarterAmount = computed(() => Math.max(1, Math.floor(potBase.value * 0.25)));
const halfAmount = computed(() => Math.max(1, Math.floor(potBase.value * 0.5)));
const fullAmount = computed(() => Math.max(1, potBase.value));

const canRaise = computed(() => {
    // Can only raise if I have more chips than the call amount AND opponent has chips
    return myChips.value > callAmount.value && opponentChips.value > 0;
});

// --- Actions ---
function handleVsScreenFinish() {
    console.log("🎬 VS Screen Finished");
    showVsScreen.value = false;
    // Trigger card deal animation after VS screen
    setTimeout(dealCards, 500);
}

const pendingOptimisticAction = ref(false);

function doAction(action: string, amount: number = 0, betLabel?: string) {
    socket.emit('indian_poker:bet', { roomId, action, amount, betLabel });
    
    // 🚀 Optimistic Animation: Move chips immediately
    if (['CALL', 'RAISE', 'ALLIN'].includes(action)) {
        // Skip animation for CHECK (Call 0)
        if (action === 'CALL' && amount === 0) {
             lastAction.value = { uid: me.value?.uid, action: 'CALL', amount: 0 };
             return;
        }

        console.log("🚀 Optimistic Chip Animation: ME -> POT");
        // Disable UI immediately
        currentTurnUid.value = ''; 
        
        animateChips(myAreaRef.value, potRef.value, 5);
        pendingOptimisticAction.value = true; // Suppress next server animation for me
        
        // Optimistic Action Display
        let displayAmount = amount;
        if (action === 'RAISE') {
            displayAmount = callAmount.value + amount;
        } else if (action === 'CALL') {
            displayAmount = amount || Math.min(myChips.value, callAmount.value);
        } else if (action === 'ALLIN') {
            displayAmount = myChips.value;
        }

        lastAction.value = { uid: me.value?.uid, action: action, amount: displayAmount, bet_label: betLabel };
    }
}

function manualRefresh() {
    console.log("🔄 Manual Refresh");
    socket.emit('request_game_state', { 
        roomId, 
        uid: auth.currentUser?.uid,
        players: players.value 
    });
}

function leaveGame() {
    if (confirm("정말 게임을 나가시겠습니까? 패배 처리될 수 있습니다.")) {
        // 🔥 [FIX] Use surrender action to trigger IndianPokerHandler.leave_game (with chip transfer)
        socket.emit('indian_poker:action', { roomId, action: 'surrender' });
        // Wait for Game Over event
    }
}

function goHome() {
    // If game is over, just leave
    if (gameOver.value) {
        router.push('/game-lobby');
        return;
    }

    // If game is active, ask for confirmation
    if (confirm("게임을 나가시겠습니까? 패배 처리됩니다.")) {
        // Emit surrender action to server
        // Server will trigger Game Over -> Defeat UI
        socket.emit('indian_poker:action', { roomId, action: 'surrender' });
        
        // We don't push to lobby here. We wait for Game Over UI.
        // The Game Over UI has a "Lobby" button which calls goHome again, 
        // catching the first if(gameOver.value) block.
    }
}

function showToast(nickname: string, action: string) {
    actionToastPlayer.value = nickname;
    actionToastMessage.value = action;
    showActionToast.value = true;
    setTimeout(() => {
        showActionToast.value = false;
    }, 2000);
}

function startLocalTimer(duration: number) {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft.value = duration;
    maxTime.value = duration;
    
    timerInterval = window.setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            if (timerInterval) clearInterval(timerInterval);
        }
    }, 1000);
}

function stopLocalTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// --- Animation Functions ---
function animateElement(type: 'card'|'chip', startRect: DOMRect, endRect: DOMRect, duration: number = 600) {
    const id = Date.now() + Math.random();
    
    // Initial Position
    flyingObjects.value.push({
        id,
        type,
        x: startRect.left + startRect.width / 2 - (type === 'card' ? 50 : 10), // Center offset
        y: startRect.top + startRect.height / 2 - (type === 'card' ? 75 : 10),
        duration
    });

    // Trigger Move (Next Tick)
    setTimeout(() => {
        const obj = flyingObjects.value.find(o => o.id === id);
        if (obj) {
            obj.x = endRect.left + endRect.width / 2 - (type === 'card' ? 50 : 10);
            obj.y = endRect.top + endRect.height / 2 - (type === 'card' ? 75 : 10);
        }
    }, 50);

    // Cleanup
    setTimeout(() => {
        flyingObjects.value = flyingObjects.value.filter(o => o.id !== id);
    }, duration + 50);
}

function dealCards() {
    console.log("🃏 Dealing Cards Animation Triggered");
    cardsDealt.value = false; // Force hide before animating
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const startRect = { left: centerX, top: centerY, width: 0, height: 0 } as DOMRect;

    // Animate to Me
    if (myCardRef.value) {
        const endRect = myCardRef.value.getBoundingClientRect();
        animateElement('card', startRect, endRect, 800);
    }

    // Animate to Opponent
    if (opponentCardRef.value) {
        const endRect = opponentCardRef.value.getBoundingClientRect();
        animateElement('card', startRect, endRect, 800);
    }

    // Reveal real cards after animation
    setTimeout(() => {
        cardsDealt.value = true;
    }, 800);
}

function animateChips(fromEl: HTMLElement | null, toEl: HTMLElement | null, count: number = 5) {
    if (!fromEl || !toEl) {
        console.warn("⚠️ animateChips: Missing element", fromEl, toEl);
        return;
    }
    console.log("🎬 animateChips:", fromEl.className || fromEl, "->", toEl.className || toEl);
    
    const startRect = fromEl.getBoundingClientRect();
    const endRect = toEl.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            animateElement('chip', startRect, endRect, 600);
        }, i * 100); // Staggered
    }
}

// --- Socket Events ---
onMounted(() => {
    socketId.value = socket.id;
    isConnected.value = socket.connected;
    
    showVsScreen.value = true;
    cardsDealt.value = false; // Hide cards initially
    
    setTimeout(() => {
        if (showVsScreen.value) {
            console.warn("⏰ Force hiding VS screen (Timeout)");
            showVsScreen.value = false;
            dealCards();
        }
    }, 10000);

    manualRefresh();

    socket.on('connect', () => {
        isConnected.value = true;
        socketId.value = socket.id;
        manualRefresh();
    });

    socket.on('disconnect', () => isConnected.value = false);

    socket.on('indian_poker:update_state', (data) => {
        console.log("📥 Update State:", data);
        
        if (data.players && data.players.length > 0) {
            players.value = data.players;
        }

        const repairedChips = { ...data.chips };
        const repairedHands = { ...data.hands };
        // Trust server chips. Only repair hands if missing.
        players.value.forEach(p => {
            if (repairedHands[p.uid] === undefined) repairedHands[p.uid] = 'HIDDEN';
        });
        
        // Show Toast & Animate Chips (For BOTH players)
        if (data.lastAction) {
            console.log("🔔 Last Action:", data.lastAction);
            const p = players.value.find(p => p.uid === data.lastAction.uid);
            // Toast removed as per user request
            // if (p) {
            //     let actionText = data.lastAction.action;
            //     if (data.lastAction.bet_label) {
            //         actionText = data.lastAction.bet_label;
            //     } else if (data.lastAction.action === 'CALL' && data.lastAction.amount === 0) {
            //         actionText = 'CHECK';
            //     }
            //     showToast(p.nickname, actionText);
            // }
            
            // Animate Chips for Bet (Wait for Toast)
            if (['CALL', 'RAISE', 'ALLIN'].includes(data.lastAction.action)) {
                let shouldAnimate = true;

                // Check if we should skip animation (Optimistic already handled it for ME)
                if (data.lastAction.uid === me.value?.uid && pendingOptimisticAction.value) {
                    console.log("⏭️ Skipping server animation (Optimistic handled)");
                    pendingOptimisticAction.value = false; // Reset
                    shouldAnimate = false;
                }

                // Skip animation for CHECK (Call 0) or FOLD/DIE
                if ((data.lastAction.action === 'CALL' && data.lastAction.amount === 0) || 
                    data.lastAction.action === 'FOLD' || 
                    data.lastAction.action === 'DIE') {
                    shouldAnimate = false;
                }

                if (shouldAnimate) {
                    console.log("💸 Triggering Chip Animation for:", data.lastAction.action);
                    setTimeout(() => {
                        const actorAvatar = data.lastAction.uid === me.value?.uid ? myAvatarRef.value : opponentAvatarRef.value;
                        // Fallback to area ref if avatar ref is missing
                        const startEl = actorAvatar || (data.lastAction.uid === me.value?.uid ? myAreaRef.value : opponentAreaRef.value);
                        
                        console.log("💸 Animation Start Element:", startEl);
                        console.log("💸 Animation End Element:", potRef.value);

                        if (startEl && potRef.value) {
                            animateChips(startEl, potRef.value, 5);
                        } else {
                            console.warn("⚠️ Cannot animate chips: Missing elements");
                        }
                    }, 200); // Reduced delay to make it feel more responsive
                }
            }
        }

        // State updates moved to AFTER round check to ensure detection works

        // Detect New Round & Trigger Animation
        if (data.round > currentRound.value) {
            console.log(`🔄 New Round Detected: ${currentRound.value} -> ${data.round}`);
            cardsDealt.value = false; // Reset to hide cards
            
            // Only trigger animation if VS screen is NOT showing.
            // If VS screen IS showing, handleVsScreenFinish will trigger it.
            if (!showVsScreen.value) {
                setTimeout(dealCards, 500); 
            }
        } else if (currentRound.value > 0 && !cardsDealt.value && !showVsScreen.value) {
             // If we are in a round but cards aren't dealt (e.g. refresh), deal them immediately (or animate)
             // But if we just set cardsDealt=false above, we don't want to re-enter here.
             // The above block handles the transition. This block handles the "Join Mid-Game" or "Refresh" state where round didn't change *during* this event but is already established.
             // Actually, if we refresh, currentRound is 0. So data.round > 0 triggers the first block.
             // So this else if might be redundant or for edge cases.
             // Let's stick to the first block for now.
        }

        currentRound.value = data.round;
        pot.value = data.pot;
        
        // 🔥 [FIX] Delay chip update for Game Over animation
        if (data.phase === 'GAME_OVER') {
            pendingFinalChips.value = repairedChips;
        } else {
            chips.value = repairedChips;
        }

        currentBets.value = data.currentBets;
        currentTurnUid.value = data.currentTurnUid;
        phase.value = data.phase;
        lastAction.value = data.lastAction;
        hands.value = repairedHands;
        
        // 🔥 [FIX] Update players list to get fresh data (major, year, etc.)
        if (data.players) {
            players.value = data.players;
        }
        
        // Start Timer
        if (data.timeLeft) {
            startLocalTimer(data.timeLeft);
        }

        if (currentRound.value > 1 && showVsScreen.value) {
            showVsScreen.value = false;
            // If we are stuck on VS screen but round is > 1, hide VS screen.
            // The animation will be triggered by the round check above.
        }
    });

    socket.on('indian_poker:round_result', (data) => {
        console.log("🏆 Round Result:", data);
        
        // 1. Wait for Action Animation (1.5s)
        // 1. Wait for Action Animation (2.5s) - Ensure Call animation finishes completely
        setTimeout(() => {
            // 2. Reveal Cards
            hands.value = data.hands;
            phase.value = 'SHOWDOWN';
            
            // 3. Wait for User to See Cards (2s)
            setTimeout(() => {
                // 4. Animate Chips (Pot -> Winner)
                if (data.winnerUid) {
                    const winnerAvatar = data.winnerUid === me.value?.uid ? myAvatarRef.value : opponentAvatarRef.value;
                    animateChips(potRef.value, winnerAvatar, 20); // Massive chip flow
                }
                
                // 5. Update Data (After chips fly - 1s)
                setTimeout(() => {
                    chips.value = data.chips;
                    pot.value = data.pot;
                    
                    // 6. Game Over or Next Round
                    if (!data.gameOver) {
                        setTimeout(() => {
                             // Check if new round already started (Race Condition Fix)
                             if (currentRound.value > data.round) {
                                 console.log("⏭️ Skipping Round Result cleanup (New Round already started)");
                                 return;
                             }

                             // Clear cards before next round starts
                             cardsDealt.value = false;
                             
                             // 🔥 [FIX] Only one client should trigger next round to prevent double Ante deduction
                             const isWinner = me.value?.uid === data.winnerUid;
                             const isDraw = !data.winnerUid;
                             const isHost = players.value.length > 0 && players.value[0].uid === me.value?.uid;

                             if (isWinner || (isDraw && isHost)) {
                                 console.log("🚀 Triggering next round...");
                                 socket.emit('indian_poker:next_round', { roomId });
                             }
                        }, 1000);
                    }
                }, 1000);
            }, 2000);
        }, 1500);
    });

    socket.on('game_over', (data) => {
        console.log("🏁 Game Over Received. Waiting for animations...");
        
        let notificationDelay = 0;
        let notificationDuration = 0;

        // 🔥 [FIX] Configure Notification based on reason
        if (data.reason === 'player_left') {
            const myUid = auth.currentUser?.uid;
            const winnerUid = data.winner.uid;
            console.log(`🔍 [Debug] Notification Logic: Me=${myUid}, Winner=${winnerUid}, Match=${myUid === winnerUid}`);
            
            if (myUid === winnerUid) {
                notificationMessage.value = "상대방이 나갔습니다.";
            } else {
                notificationMessage.value = "기권하였습니다.";
            }
            
            // 1. Show Notification (2s)
            setTimeout(() => {
                notificationMessage.value = ""; // Hide notification
                
                // 2. Chip Transfer Animation (Loser -> Winner)
                const loserUid = players.value.find(p => p.uid !== winnerUid)?.uid;
                if (loserUid) {
                    const winnerAvatar = myUid === winnerUid ? myAvatarRef.value : opponentAvatarRef.value;
                    const loserAvatar = myUid === loserUid ? myAvatarRef.value : opponentAvatarRef.value;
                    
                    // Fallback to area if avatar missing
                    const startEl = loserAvatar || (myUid === loserUid ? myAreaRef.value : opponentAreaRef.value);
                    const endEl = winnerAvatar || (myUid === winnerUid ? myAreaRef.value : opponentAreaRef.value);
                    
                    if (startEl && endEl) {
                        animateChips(startEl, endEl, 20); // Massive flow
                    }
                }

                // 3. Update Chips & Show Comparison (After 1.5s animation)
                setTimeout(() => {
                    if (pendingFinalChips.value) {
                        chips.value = pendingFinalChips.value;
                    }
                    isCheckingWinner.value = true;

                    // 4. Show Victory/Defeat UI (After 2s comparison)
                    setTimeout(() => {
                        isCheckingWinner.value = false;
                        
                        // Final Game Over UI
                        winner.value = data.winner;
                        payouts.value = data.payouts;
                        gameOver.value = true;
                        
                        // Stop Timer
                        stopLocalTimer();
                    }, 2000);
                }, 1500);
            }, 2000);
            
            return; // 🔥 Exit early, don't run the default logic below
        } else if (data.reason === 'turn_limit') {
            notificationMessage.value = "모든 라운드가 종료되었습니다.";
            notificationDelay = 3000; // Wait for round result animations (Card Reveal + Pot Win)
            notificationDuration = 3000; // Show longer
        }

        // Schedule Notification
        if (notificationDuration > 0) {
            setTimeout(() => {
                // Show notification
                // (The v-if="notificationMessage" in template will trigger)
                // We need to ensure we don't clear it too early if we set it here.
                // Actually, we set the value here, but we need to clear it after duration.
                
                // Re-set value here to be safe (or it's already set above? No, above sets it immediately)
                // Wait, if I set it above, it shows immediately.
                // I should set it INSIDE the timeout if delay > 0.
                
                // Let's refactor:
                // We set the message string in a temp var, then apply it in timeout.
            }, notificationDelay);
        }
        
        // Refactored Logic:
        const message = data.reason === 'player_left' ? "상대방이 나갔습니다." : 
                        data.reason === 'turn_limit' ? "모든 라운드가 종료되었습니다." : "";
        
        if (message) {
            setTimeout(() => {
                notificationMessage.value = message;
                
                // Hide after duration
                setTimeout(() => {
                    notificationMessage.value = '';
                }, notificationDuration);
            }, notificationDelay);
        }

        // Schedule Chip Comparison
        // Total wait = notificationDelay + notificationDuration + buffer?
        // Actually, Chip Comparison should start AFTER notification finishes?
        // Or concurrently? User said "Notification ... THEN ...".
        // So Chip Comparison starts at: notificationDelay + notificationDuration.
        
        const chipComparisonStartTime = (message ? (notificationDelay + notificationDuration) : 1500);

        setTimeout(() => {
            console.log("📊 Showing Chip Comparison...");
            // 2. Show Chip Comparison Phase
            isCheckingWinner.value = true;

            // 3. Wait 3 seconds, then show Game Over Overlay
            setTimeout(() => {
                isCheckingWinner.value = false;
                gameOver.value = true;
                winner.value = data.winner;
                payouts.value = data.payouts || [];
                gameOverReason.value = data.reason || 'normal';
                
                if (timerInterval) clearInterval(timerInterval);
            }, 3000);
        }, chipComparisonStartTime);
    });

});

onUnmounted(() => {
    socket.off('indian_poker:update_state');
    socket.off('indian_poker:round_result');
    socket.off('game_over');
    if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.poker-container-premium {
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at center, #2c3e50, #000000);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
    position: relative; /* For absolute positioning of flying objects */
}
/* --- Round Info --- */
.round-info {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.5rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 2px;
    background: rgba(0,0,0,0.7);
    padding: 10px 30px;
    border-radius: 30px;
    z-index: 2000;
    border: 2px solid rgba(255, 215, 0, 0.3);
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}

/* --- Flying Objects --- */
.flying-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
}

.flying-element {
    position: absolute;
    will-change: left, top;
}

.flying-card-back {
    width: 80px;
    height: 120px;
    background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
    border: 2px solid white;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.flying-chip {
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b);
    border-radius: 50%;
    border: 2px dashed #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.invisible {
    opacity: 0;
    visibility: hidden;
}

.exit-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    z-index: 100;
}

.exit-btn:hover {
    background: rgba(255, 71, 87, 0.2);
    border-color: #ff4757;
    color: #ff4757;
}

.player-area {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 100%;
    z-index: 60; /* Above cards if overlap, but cards are usually separate */
}

.player-area.opponent {
    top: 2%;
}

.player-area.me {
    bottom: 2%;
}

.player-card {
    position: relative; /* For timer bar */
    display: flex;
    align-items: center;
    gap: 15px;
    background: rgba(255, 255, 255, 0.05);
    padding: 15px 25px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    min-width: 280px;
    overflow: hidden; /* Clip timer bar */
}

.avatar-container {
    position: relative;
    overflow: visible; /* Ensure button is visible */
}

.avatar-placeholder {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 2rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.player-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.nickname {
    font-weight: 700;
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    color: white; /* 🔥 Ensure visible */
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.bet {
    font-size: 0.9rem;
    color: #ffd700; /* Gold for bet */
    font-weight: bold;
    margin-top: 2px;
}

.stake {
    font-size: 0.9rem;
    color: #aaa;
}

.chips-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
}

.chip-stack {
    position: relative;
    width: 20px;
    height: 20px;
}

/* --- Timer Bar --- */
.timer-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: rgba(0, 0, 0, 0.3);
}

.timer-bar {
    height: 100%;
    background: linear-gradient(90deg, #2ecc71, #f1c40f);
    transition: width 1s linear;
}


.chip {
    position: absolute;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b);
    border-radius: 50%;
    border: 2px dashed #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.chips-text {
    font-weight: bold;
    color: #ffd700;
    font-size: 1.1rem;
}

/* --- Timer Bar --- */
.timer-bar-container {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 10px;
}

.timer-bar {
    height: 100%;
    background: #ffd700;
    transition: width 1s linear;
}

/* --- Premium Card Styling --- */
.poker-card {
    width: 80px;
    height: 120px;
    perspective: 1000px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    transition: opacity 0.3s;
}

.opponent-card {
    top: 20%; /* Moved further up */
}

.my-card {
    bottom: 32%;
}

.card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.poker-card.revealed .card-inner {
    transform: rotateY(0deg);
}

/* Opponent card is hidden by default (show back) */
.opponent-card .card-inner {
    transform: rotateY(180deg);
}
.opponent-card.revealed .card-inner {
    transform: rotateY(0deg);
}

/* My card is revealed by default */
.my-card .card-inner {
    transform: rotateY(0deg);
}
.my-card:not(.revealed) .card-inner {
    transform: rotateY(180deg); /* Hide if not revealed (e.g. initial deal) */
}

.card-front, .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: white;
    color: black;
}

.card-front {
    background: linear-gradient(135deg, #fff, #f0f0f0);
    border: 1px solid #ccc;
}

.card-value {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(45deg, #333, #000);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.card-suit {
    font-size: 1.5rem;
    color: #333;
}

.winner-card .card-front {
    border: 4px solid #ffd700;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
    transform: scale(1.1);
    z-index: 100;
}

/* --- Action Indicator (Unified Position) --- */
.action-indicator {
    position: absolute;
    top: 35%; /* Between Opponent Card (20%) and Pot (Center) */
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.85);
    padding: 15px 30px;
    border-radius: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    z-index: 1000;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    min-width: 120px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.action-indicator.me {
    border: 3px solid #2ecc71; /* Green for Me */
    /* Removed bottom/top override to keep unified position */
}

.action-indicator.opponent {
    border: 3px solid #e74c3c; /* Red for Opponent */
}

.action-indicator.me .action-text {
    color: #2ecc71;
}

.action-indicator.opponent .action-text {
    color: #e74c3c;
}

.action-text {
    font-size: 2rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.action-amount {
    font-size: 1.2rem;
    color: #ffd700;
    font-weight: bold;
}

/* --- Profile View Button --- */
.player-card-wrapper {
    display: flex;
    align-items: center;
    gap: 15px; /* Space between card and button */
}

.profile-view-btn {
    /* Removed absolute positioning */
    position: relative; 
    top: auto;
    left: auto;
    transform: none;
    margin-left: 0;
    right: auto;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 100;
}

.profile-view-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

@keyframes popIn {
    from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.card-back {
    background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
    transform: rotateY(180deg);
    border: 2px solid white;
}

.pattern {
    width: 100%;
    height: 100%;
    background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px);
    opacity: 0.3;
}

.my-turn .card-inner {
    box-shadow: 0 0 20px #ffd700;
    border: 2px solid #ffd700;
}

/* --- Table Center --- */
.table-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.pot-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
}

.pot-display {
    background: rgba(0, 0, 0, 0.6);
    padding: 15px 40px;
    border-radius: 30px;
    border: 1px solid rgba(255, 215, 0, 0.3);
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.pot-label {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 5px;
    letter-spacing: 2px;
}

.pot-value {
    font-size: 2rem;
    font-weight: 800;
    color: #ffd700;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

/* --- Controls --- */
.controls {
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 90%;
    max-width: 600px;
    z-index: 1000;
}

.control-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    width: 100%;
}

.action-btn {
    flex: 1;
    padding: 8px 5px;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    color: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 60px;
}

.btn-label {
    font-size: 1rem;
    margin-bottom: 2px;
}

.btn-amount {
    font-size: 0.75rem;
    opacity: 0.9;
    font-weight: 500;
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
}

.fold { background: linear-gradient(to bottom, #7f8c8d, #2c3e50); }
.check { background: linear-gradient(to bottom, #3498db, #2980b9); }
.call { background: linear-gradient(to bottom, #3498db, #2980b9); }
.raise { background: linear-gradient(to bottom, #e67e22, #d35400); }
.allin { background: linear-gradient(to bottom, #e74c3c, #c0392b); }

.action-btn:not(:disabled):hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}

.action-btn:not(:disabled):active {
    transform: translateY(1px);
}

.game-result {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.9);
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    border: 2px solid #ffd700;
    z-index: 1000;
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
    from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.lobby-btn {
    margin-top: 20px;
    padding: 10px 30px;
    background: #ffd700;
    color: black;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
}

/* --- Game Over Overlay (Polished) --- */
.game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.5s ease;
}

.result-card {
    background: rgba(44, 62, 80, 0.9);
    padding: 50px;
    border-radius: 30px;
    box-shadow: 0 0 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    text-align: center;
    border: 1px solid rgba(255, 215, 0, 0.3);
    min-width: 550px;
    transform: scale(0.9);
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.result-card.victory {
    border-color: #ffd700;
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.2), inset 0 0 0 1px rgba(255, 215, 0, 0.3);
}

.result-card.defeat {
    border-color: #e74c3c;
    box-shadow: 0 0 60px rgba(231, 76, 60, 0.2), inset 0 0 0 1px rgba(231, 76, 60, 0.3);
}

.result-icon {
    font-size: 5rem;
    margin-bottom: 10px;
    filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));
    animation: float 3s ease-in-out infinite;
}

.result-card h2 {
    font-size: 3.5rem;
    margin-bottom: 30px;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: linear-gradient(to bottom, #fff, #ccc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.result-card.victory h2 {
    background: linear-gradient(to bottom, #ffd700, #f1c40f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.result-card.defeat h2 {
    background: linear-gradient(to bottom, #e74c3c, #c0392b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.winner-announce {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-bottom: 40px;
}

.winner-avatar {
    position: relative;
    padding: 5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd700, #f1c40f);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
}

.winner-text {
    font-size: 1.5rem;
    color: #ccc;
}

.winner-name {
    color: #fff;
    font-weight: bold;
    font-size: 1.8rem;
}

.payout-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 40px;
    width: 100%;
}

.payout-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
    padding: 15px 25px;
    border-radius: 15px;
    font-size: 1.2rem;
    transition: transform 0.2s;
}

.payout-item:hover {
    transform: scale(1.02);
    background: rgba(255, 255, 255, 0.1);
}

.payout-item.winner {
    border-left: 5px solid #ffd700;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
}

.payout-item.loser {
    border-left: 5px solid #e74c3c;
    background: linear-gradient(90deg, rgba(231, 76, 60, 0.1), transparent);
}

.p-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.p-rank { font-size: 1.8rem; }
.p-name { font-weight: bold; color: #fff; }

.p-result {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.p-change {
    font-size: 1.4rem;
    font-weight: bold;
}

.p-change.plus { color: #2ecc71; text-shadow: 0 0 10px rgba(46, 204, 113, 0.4); }
.p-change.minus { color: #e74c3c; text-shadow: 0 0 10px rgba(231, 76, 60, 0.4); }

.p-total {
    font-size: 0.9rem;
    color: #888;
}

.home-btn {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    border: none;
    padding: 18px 60px;
    border-radius: 50px;
    font-size: 1.4rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.home-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(52, 152, 219, 0.6);
    filter: brightness(1.1);
}

@keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.round-indicator {
    position: absolute;
    top: 20px;
    right: 20px;
    left: auto;
    transform: none;
    background: rgba(0, 0, 0, 0.6);
    padding: 8px 20px;
    border-radius: 20px;
    color: #fff;
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: 2px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    z-index: 50;
}

.round-num {
    color: #ffd700;
    font-size: 1.4rem;
    margin: 0 5px;
}

.max-round {
    color: #aaa;
    font-size: 1rem;
}

.player-card.active-turn {
    transform: scale(1.05);
    z-index: 10;
}

.opponent .player-card.active-turn {
    box-shadow: 0 0 30px rgba(231, 76, 60, 0.6);
    border: 2px solid #e74c3c;
}

.me .player-card.active-turn {
    box-shadow: 0 0 30px rgba(46, 204, 113, 0.6);
    border: 2px solid #2ecc71;
}

/* --- Chip Comparison Overlay --- */
.chip-comparison-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.5s ease-out;
}

.comparison-content {
    text-align: center;
    color: white;
}

.comp-title {
    font-size: 2rem;
    font-weight: 800;
    color: #ffd700;
    margin-bottom: 40px;
    letter-spacing: 5px;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.comp-players {
    display: flex;
    align-items: center;
    gap: 50px;
}

.comp-player {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transform: scale(0.9);
    transition: all 0.5s;
}

.comp-player.winner {
    opacity: 1;
    transform: scale(1.2);
}

.comp-player.winner .comp-chips {
    color: #2ecc71;
    text-shadow: 0 0 20px rgba(46, 204, 113, 0.8);
}

.comp-avatar-wrapper {
    width: 120px;
    height: 120px;
    margin-bottom: 15px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}

.comp-player.winner .comp-avatar-wrapper {
    border-color: #ffd700;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
}

.comp-name {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 10px;
    color: #aaa;
}

.comp-chips {
    font-size: 2.5rem;
    font-weight: 900;
}

.comp-vs {
    font-size: 3rem;
    font-weight: 900;
    font-style: italic;
    color: #e74c3c;
}
.notification-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
    animation: fadeIn 0.3s ease-out;
}

.notification-content {
    background: rgba(20, 20, 20, 0.9);
    border: 2px solid #ffd700;
    padding: 2rem 4rem;
    border-radius: 15px;
    color: #ffd700;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
