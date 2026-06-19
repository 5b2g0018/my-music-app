import { useEffect, useState } from 'react'
import './App.css'

// 💡 引入音樂 App Firebase 設定
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'

// 🍭 TWICE 
const twiceAllMembersBg = "https://preview.redd.it/230522-twitter-update-twice-photos-from-their-tokyo-concert-v0-b7605sklic1b1.jpg?width=1080&crop=smart&auto=webp&s=d0947bc756083070ae6b3e624a5f7cdab745bd70"

// 🖤 BLACKPINK 霸氣黑粉專屬大圖
const blackpinkBg = "https://www.hollywoodreporter.com/wp-content/uploads/2025/07/3.jpg?w=3000"

// 🌌 aespa 虛擬未來科幻風大圖
const aespaBg = "https://www.freestyle666.com/uploads/allimg/230227/1K94R3Z-2.jpg"

// 👑 GD 權志龍潮流大圖（極具個人色彩的街頭塗鴉與黑金視覺）
const gdragonBg = "https://media.gq.com.tw/photos/6908cbccf6cdb30785272713/16:9/w_2560%2Cc_limit/20251101%2520GD_00031-1.jpg"

// ✨ IVE 華麗大千金視覺大圖（充滿少女鑽石光芒、精緻高奢感的夢幻派對視覺）
const iveBg = "https://pic3.zhimg.com/v2-30154211b4ea674dfee035e72b77f3fa_1440w.jpg";

// 👹 BABYMONSTER 怪物新人大圖（充滿地下重工業嘻哈、煙霧與暗黑美式街頭感）
const babymonsterBg = "https://www.allkpop.com/upload/2023/11/content/191119/1700410740-1699557293-untitled-1.jpg"

// 💜 BTS 主題大圖 (防彈少年團深紫色星夜/舞台視覺)
const btsBg = "https://cc.tvbs.com.tw/img/upload/2026/03/05/20260305113033-da4089d7.jpg"

// 💎 SEVENTEEN 主題大圖 (雙官色 Rose Quartz & Serenity 寧靜粉藍粉雲/晚霞)
const seventeenBg = "https://www.nme.com/wp-content/uploads/2022/04/seventeen-darling-music-video-english-single-2022.jpg"

// 🌸 Anime 日本動漫主題大圖 (新海誠風格蔚藍天空與粉櫻綻放)
const animeBg = "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1500&auto=format&fit=crop"
interface Comment {
  author: string
  text: string
  date: string
  timestamp: number
}

interface DiaryItem {
  id: string
  userEmail?: string
  author?: string
  title: string
  content: string
  mood: string
  date: string
  timestamp: number
  isSecret?: boolean
  password?: string
  isPublic?: boolean
  photo?: string
  likes?: number
  likedBy?: string[]
  comments?: Comment[]
  bias?: string
  bgm?: string
}

interface TimeCapsuleItem {
  id: string
  userEmail: string
  content: string
  unlockDate: string
  createdAt: number
  isOpened: boolean
}

interface CheerItem {
  id: string
  userEmail: string
  author: string
  content: string
  createdAt: number
}

interface CountdownEventItem {
  id: string
  userEmail: string
  title: string
  targetDate: string
  createdAt: number
}

interface ScheduleItem {
  id: string
  userEmail: string
  title: string
  date: string
  type: 'comeback' | 'concert' | 'birthday' | 'show' | 'other'
  createdAt: number
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'register' | 'login' | 'capsule' | 'review' | 'publicWall' | 'viewer' | 'personalProfile'>('home')
  // 🛠️ 擴充主題類型：加入 bts, seventeen, anime
  const [theme, setTheme] = useState<'classic' | 'blackpink' | 'aespa' | 'kpop' | 'gd' | 'ive' | 'babymonster' | 'bts' | 'seventeen' | 'anime'>('classic')
  const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryMood, setDiaryMood] = useState('😊 開心')
  const [diaryBgm, setDiaryBgm] = useState('')
  const [myDiaries, setMyDiaries] = useState<DiaryItem[]>([])
  const [isSecret, setIsSecret] = useState(false)
  const [diaryPassword, setDiaryPassword] = useState('')
  const [diaryPhoto, setDiaryPhoto] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [futureLetter, setFutureLetter] = useState('')
  const [unlockDate, setUnlockDate] = useState('2027-01-01')

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => localStorage.getItem('loggedInUser'))
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('userEmail'))
  const [publicDiaries, setPublicDiaries] = useState<DiaryItem[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [activeDiary, setActiveDiary] = useState<DiaryItem | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  // 👥 使用者名稱快取
  const [usersCache, setUsersCache] = useState<{ [email: string]: string }>({})

  // 📬 時光膠囊狀態
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsuleItem[]>([])

  // ⚙️ 設定 Modal 狀態與使用者名稱修改
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [userBio, setUserBio] = useState('任性小松鼠(￣▽￣)')
  const [userAvatar, setUserAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop')
  const [newBio, setNewBio] = useState('')
  const [newAvatar, setNewAvatar] = useState('')

  // 📣 應援跑馬燈狀態
  const [cheers, setCheers] = useState<CheerItem[]>([])
  const [showAddCheerModal, setShowAddCheerModal] = useState(false)
  const [newCheerContent, setNewCheerContent] = useState('')

  // 📅 K-Pop 追星中控台 & 行事曆 & 倒數
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [countdownEvents, setCountdownEvents] = useState<CountdownEventItem[]>([])
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now())
  const [showAddCountdownModal, setShowAddCountdownModal] = useState(false)
  const [newCountdownTitle, setNewCountdownTitle] = useState('')
  const [newCountdownDate, setNewCountdownDate] = useState('')
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [newScheduleTitle, setNewScheduleTitle] = useState('')
  const [newScheduleDate, setNewScheduleDate] = useState('')
  const [newScheduleType, setNewScheduleType] = useState<'comeback' | 'concert' | 'birthday' | 'show' | 'other'>('comeback')
  const [expandedCapsules, setExpandedCapsules] = useState<string[]>([])
  const toggleExpandCapsule = (id: string) => {
    setExpandedCapsules(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // 🔔 時光膠囊解鎖通知
  const [unlockedNotifications, setUnlockedNotifications] = useState<TimeCapsuleItem[]>([])
  const [activeNotificationCapsule, setActiveNotificationCapsule] = useState<TimeCapsuleItem | null>(null)

  // 📅 年度回顧行事曆 & 專屬行程狀態
  const [reviewSchedules, setReviewSchedules] = useState<ScheduleItem[]>([])
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date())
  const [newReviewScheduleTitle, setNewReviewScheduleTitle] = useState('')
  const [newReviewScheduleType, setNewReviewScheduleType] = useState<'comeback' | 'concert' | 'birthday' | 'show' | 'other'>('comeback')
  const [showAddReviewScheduleForm, setShowAddReviewScheduleForm] = useState(false)

  const fetchCheers = async () => {
    try {
      const snap = await getDocs(collection(db, 'cheers'))
      const list: CheerItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        list.push({
          id: d.id,
          userEmail: data.userEmail || '',
          author: data.author || '匿名粉絲',
          content: data.content || '',
          createdAt: data.createdAt || Date.now()
        })
      })
      list.sort((a, b) => b.createdAt - a.createdAt)
      setCheers(list.slice(0, 20))
    } catch (e) {
      console.error('Error fetching cheers:', e)
    }
  }

  const fetchSchedules = async () => {
    try {
      const snap = await getDocs(collection(db, 'schedules'))
      const list: ScheduleItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        // 自動清理舊的帶有動態時間戳記的預設行程，防止資料污染
        if (d.id.startsWith('def_sc_') && d.id.length > 10) {
          deleteDoc(doc(db, 'schedules', d.id)).catch(console.error);
        } else {
          list.push({
            id: d.id,
            userEmail: data.userEmail || '',
            title: data.title || '',
            date: data.date || '',
            type: data.type || 'other',
            createdAt: data.createdAt || Date.now()
          })
        }
      })

      // 如果資料庫為空，寫入真實的預設行程資料到 Firestore
      if (list.length === 0) {
        const defaultSchedulesList: Omit<ScheduleItem, 'id'>[] = [
          { title: '📺 M Countdown 音樂打歌直播', date: new Date().toISOString().split('T')[0], type: 'show', userEmail: 'system', createdAt: Date.now() },
          { title: '💿 (G)I-DLE 新專回歸發行', date: '2026-07-06', type: 'comeback', userEmail: 'system', createdAt: Date.now() },
          { title: '🎂 IVE 張員瑛生日慶祝特別企劃', date: '2026-08-31', type: 'birthday', userEmail: 'system', createdAt: Date.now() },
          { title: '🎤 ATEEZ 日本新單曲發行', date: '2026-07-29', type: 'concert', userEmail: 'system', createdAt: Date.now() }
        ];

        for (let i = 0; i < defaultSchedulesList.length; i++) {
          const docId = `def_sc_${i}`;
          await setDoc(doc(db, 'schedules', docId), defaultSchedulesList[i]);
          if (!list.some(x => x.id === docId)) {
            list.push({ id: docId, ...defaultSchedulesList[i] });
          }
        }
      }

      list.sort((a, b) => a.date.localeCompare(b.date))
      setSchedules(list)
    } catch (e) {
      console.error('Error fetching schedules:', e)
    }
  }

  const fetchCountdownEvents = async () => {
    try {
      const snap = await getDocs(collection(db, 'countdown_events'))
      const list: CountdownEventItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        // 自動清理舊的帶有動態時間戳記的預設倒數活動
        if (d.id.startsWith('def_cd_') && d.id.length > 10) {
          deleteDoc(doc(db, 'countdown_events', d.id)).catch(console.error);
        } else {
          list.push({
            id: d.id,
            userEmail: data.userEmail || '',
            title: data.title || '',
            targetDate: data.targetDate || '',
            createdAt: data.createdAt || Date.now()
          })
        }
      })

      // 如果資料庫為空，寫入真實的預設倒數活動到 Firestore
      if (list.length === 0) {
        const defaultCountdownList: Omit<CountdownEventItem, 'id'>[] = [
          { title: '🪐 aespa 日本新單曲發布倒數', targetDate: '2026-07-24T12:00', userEmail: 'system', createdAt: Date.now() },
          { title: '💿 (G)I-DLE 夏日專輯回歸倒數', targetDate: '2026-07-06T18:00', userEmail: 'system', createdAt: Date.now() }
        ];

        for (let i = 0; i < defaultCountdownList.length; i++) {
          const docId = `def_cd_${i}`;
          await setDoc(doc(db, 'countdown_events', docId), defaultCountdownList[i]);
          if (!list.some(x => x.id === docId)) {
            list.push({ id: docId, ...defaultCountdownList[i] });
          }
        }
      }

      list.sort((a, b) => a.targetDate.localeCompare(b.targetDate))
      setCountdownEvents(list)
    } catch (e) {
      console.error('Error fetching countdown events:', e)
    }
  }

  const fetchUserProfile = async (email: string) => {
    try {
      const emailLower = email.trim().toLowerCase()
      const userDoc = await getDoc(doc(db, 'app_users', emailLower))
      if (userDoc.exists()) {
        const data = userDoc.data()
        if (data.bio !== undefined) setUserBio(data.bio)
        if (data.avatar !== undefined) setUserAvatar(data.avatar)
      }
    } catch (e) {
      console.error('Error fetching user profile:', e)
    }
  }

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      alert('請輸入姓名喔！')
      return
    }
    if (!userEmail) return
    const emailLower = userEmail.trim().toLowerCase()
    try {
      await updateDoc(doc(db, 'app_users', emailLower), {
        name: newUsername.trim(),
        bio: newBio.trim(),
        avatar: newAvatar
      })
      localStorage.setItem('loggedInUser', newUsername.trim())
      setLoggedInUser(newUsername.trim())
      setUserBio(newBio.trim())
      setUserAvatar(newAvatar)
      setUsersCache(prev => ({ ...prev, [emailLower]: newUsername.trim() }))
      await fetchUsersCache()
      await fetchUserDiaries(emailLower)
      setShowSettingsModal(false)
      alert('個人資料更新成功！')
    } catch (e) {
      console.error('Error updating username:', e)
      alert('更新個人資料失敗')
    }
  }

  const handleAddCheer = async () => {
    if (!newCheerContent.trim()) {
      alert('應援內容不能為空喔！')
      return
    }
    const emailLower = (userEmail || 'anonymous@memoir.com').trim().toLowerCase()
    const authorName = loggedInUser || '匿名應援'
    try {
      const cheerId = `cheer_${Date.now()}`
      await setDoc(doc(db, 'cheers', cheerId), {
        userEmail: emailLower,
        author: authorName,
        content: newCheerContent.trim(),
        createdAt: Date.now()
      })
      setNewCheerContent('')
      setShowAddCheerModal(false)
      await fetchCheers()
    } catch (e) {
      console.error('Error saving cheer:', e)
      alert('應援留言儲存失敗')
    }
  }

  const handleSaveCountdown = async () => {
    if (!newCountdownTitle.trim() || !newCountdownDate) {
      alert('請填寫完整資訊！')
      return
    }
    const emailLower = (userEmail || 'anonymous@memoir.com').trim().toLowerCase()
    try {
      const countdownId = `countdown_${Date.now()}`
      await setDoc(doc(db, 'countdown_events', countdownId), {
        userEmail: emailLower,
        title: newCountdownTitle.trim(),
        targetDate: newCountdownDate,
        createdAt: Date.now()
      })
      setNewCountdownTitle('')
      setNewCountdownDate('')
      setShowAddCountdownModal(false)
      await fetchCountdownEvents()
    } catch (e) {
      console.error('Error saving countdown event:', e)
      alert('新增倒數失敗')
    }
  }

  const handleDeleteCountdown = async (id: string) => {
    if (!confirm('確定要刪除此倒數計時嗎？')) return
    try {
      await deleteDoc(doc(db, 'countdown_events', id))
      await fetchCountdownEvents()
    } catch (e) {
      console.error(e)
      alert('刪除失敗')
    }
  }

  const handleSaveSchedule = async () => {
    if (!newScheduleTitle.trim() || !newScheduleDate) {
      alert('請填寫完整資訊！')
      return
    }
    const emailLower = (userEmail || 'anonymous@memoir.com').trim().toLowerCase()
    try {
      const scheduleId = `schedule_${Date.now()}`
      await setDoc(doc(db, 'schedules', scheduleId), {
        userEmail: emailLower,
        title: newScheduleTitle.trim(),
        date: newScheduleDate,
        type: newScheduleType,
        createdAt: Date.now()
      })
      setNewScheduleTitle('')
      setNewScheduleDate('')
      setNewScheduleType('comeback')
      setShowAddScheduleModal(false)
      await fetchSchedules()
    } catch (e) {
      console.error('Error saving schedule:', e)
      alert('新增行程失敗')
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('確定要刪除此行程嗎？')) return
    try {
      await deleteDoc(doc(db, 'schedules', id))
      await fetchSchedules()
    } catch (e) {
      console.error(e)
      alert('刪除失敗')
    }
  }

  const fetchReviewSchedules = async () => {
    try {
      const snap = await getDocs(collection(db, 'review_schedules'))
      const list: ScheduleItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        list.push({
          id: d.id,
          userEmail: data.userEmail || '',
          title: data.title || '',
          date: data.date || '',
          type: data.type || 'other',
          createdAt: data.createdAt || Date.now()
        })
      })
      list.sort((a, b) => a.date.localeCompare(b.date))
      setReviewSchedules(list)
    } catch (e) {
      console.error('Error fetching review schedules:', e)
    }
  }

  const handleSaveReviewSchedule = async (selectedDateStr: string) => {
    if (!newReviewScheduleTitle.trim()) {
      alert('請填寫行程名稱！')
      return
    }
    const emailLower = (userEmail || 'anonymous@memoir.com').trim().toLowerCase()
    try {
      const scheduleId = `rev_schedule_${Date.now()}`
      await setDoc(doc(db, 'review_schedules', scheduleId), {
        userEmail: emailLower,
        title: newReviewScheduleTitle.trim(),
        date: selectedDateStr,
        type: newReviewScheduleType,
        createdAt: Date.now()
      })
      setNewReviewScheduleTitle('')
      setNewReviewScheduleType('comeback')
      setShowAddReviewScheduleForm(false)
      await fetchReviewSchedules()
    } catch (e) {
      console.error('Error saving review schedule:', e)
      alert('新增行程失敗')
    }
  }

  const handleDeleteReviewSchedule = async (id: string) => {
    if (!confirm('確定要刪除此行程嗎？')) return
    try {
      await deleteDoc(doc(db, 'review_schedules', id))
      await fetchReviewSchedules()
    } catch (e) {
      console.error(e)
      alert('刪除失敗')
    }
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);

    const bodyStyle = document.body.style;
    if (theme === 'gd') {
      bodyStyle.backgroundImage = `linear-gradient(to bottom, rgba(15,15,15,0.95), rgba(18,14,11,0.92)), url(${gdragonBg})`;
      bodyStyle.backgroundSize = 'cover';
      bodyStyle.backgroundPosition = 'center center';
      bodyStyle.backgroundRepeat = 'no-repeat';
      bodyStyle.backgroundAttachment = 'fixed';
    } else if (theme === 'bts') {
      bodyStyle.backgroundImage = `linear-gradient(to bottom, rgba(10,5,20,0.95), rgba(20,5,30,0.92)), url(${btsBg})`;
      bodyStyle.backgroundSize = 'cover';
      bodyStyle.backgroundPosition = 'center center';
      bodyStyle.backgroundRepeat = 'no-repeat';
      bodyStyle.backgroundAttachment = 'fixed';
    } else if (theme === 'seventeen') {
      bodyStyle.backgroundImage = `linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(240,245,255,0.82)), url(${seventeenBg})`;
      bodyStyle.backgroundSize = 'cover';
      bodyStyle.backgroundPosition = 'center center';
      bodyStyle.backgroundRepeat = 'no-repeat';
      bodyStyle.backgroundAttachment = 'fixed';
    } else if (theme === 'anime') {
      bodyStyle.backgroundImage = `linear-gradient(to bottom, rgba(30,30,50,0.85), rgba(20,20,40,0.88)), url(${animeBg})`;
      bodyStyle.backgroundSize = 'cover';
      bodyStyle.backgroundPosition = 'center center';
      bodyStyle.backgroundRepeat = 'no-repeat';
      bodyStyle.backgroundAttachment = 'fixed';
    } else {
      bodyStyle.backgroundImage = 'var(--bg-pattern)';
      bodyStyle.backgroundSize = 'var(--bg-pattern-size, auto)';
      bodyStyle.backgroundPosition = 'var(--bg-pattern-pos, center)';
      bodyStyle.backgroundRepeat = 'no-repeat';
      bodyStyle.backgroundAttachment = 'scroll';
    }
  }, [theme])

  const fetchUserDiaries = async (email: string) => {
    try {
      const emailLower = email.trim().toLowerCase()
      const q = query(collection(db, 'diaries'), where('userEmail', '==', emailLower))
      const snap = await getDocs(q)
      const diariesList: DiaryItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        diariesList.push({
          id: d.id,
          userEmail: data.userEmail,
          author: data.author,
          title: data.title,
          content: data.content,
          mood: data.mood,
          date: data.date,
          timestamp: data.timestamp || Date.now(),
          isSecret: data.isSecret || false,
          password: data.password || undefined,
          isPublic: data.isPublic || false,
          bgm: data.bgm || '',
          photo: data.photo || '',
          likedBy: data.likedBy || [],
          likes: data.likes || 0,
          comments: data.comments || []
        })
      })
      diariesList.sort((b, a) => a.timestamp - b.timestamp)
      setMyDiaries(diariesList)
      // 同時抓取所有公開日記
      await fetchPublicDiaries()
    } catch (error) {
      console.error(error)
    }
  }

  const fetchPublicDiaries = async () => {
    try {
      const q = query(collection(db, 'diaries'), where('isPublic', '==', true))
      const snap = await getDocs(q)
      const publicList: DiaryItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        publicList.push({
          id: d.id,
          userEmail: data.userEmail,
          author: data.author,
          title: data.title,
          content: data.content,
          mood: data.mood,
          date: data.date,
          timestamp: data.timestamp || Date.now(),
          isSecret: data.isSecret || false,
          password: data.password || undefined,
          isPublic: true,
          bgm: data.bgm || '',
          photo: data.photo || '',
          likedBy: data.likedBy || [],
          likes: data.likes || 0,
          comments: data.comments || []
        })
      })
      publicList.sort((b, a) => a.timestamp - b.timestamp)
      setPublicDiaries(publicList)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchUsersCache = async () => {
    try {
      const snap = await getDocs(collection(db, 'app_users'))
      const cache: { [email: string]: string } = {}
      snap.forEach((d) => {
        const data = d.data()
        if (data.email && data.name) {
          cache[data.email.trim().toLowerCase()] = data.name.trim()
        }
      })
      setUsersCache(cache)
    } catch (e) {
      console.error('Error fetching users cache:', e)
    }
  }

  const handleLikeDiary = async (diaryId: string, currentLikedBy: string[] = []) => {
    if (!loggedInUser || !userEmail) {
      alert('請先登入後再進行按讚喔！')
      setCurrentView('login')
      return
    }

    const emailLower = userEmail.trim().toLowerCase()
    const hasLiked = currentLikedBy.includes(emailLower)
    const newLikedBy = hasLiked
      ? currentLikedBy.filter(email => email !== emailLower)
      : [...currentLikedBy, emailLower]

    try {
      const diaryRef = doc(db, 'diaries', diaryId)
      await updateDoc(diaryRef, {
        likedBy: newLikedBy,
        likes: newLikedBy.length
      })

      // Update local states
      const updateState = (prevList: DiaryItem[]) =>
        prevList.map(diary =>
          diary.id === diaryId
            ? { ...diary, likedBy: newLikedBy, likes: newLikedBy.length }
            : diary
        )

      setPublicDiaries(prev => updateState(prev))
      setMyDiaries(prev => updateState(prev))

      // Also update activeDiary if it matches
      setActiveDiary(prev => (prev && prev.id === diaryId) ? { ...prev, likedBy: newLikedBy, likes: newLikedBy.length } : prev)
    } catch (e) {
      console.error('Error updating likes:', e)
      alert('按讚失敗，請稍後再試。')
    }
  }

  const handleCommentDiary = async (diaryId: string, currentComments: Comment[] = []) => {
    if (!loggedInUser || !userEmail) {
      alert('請先登入後再進行留言喔！')
      setCurrentView('login')
      return
    }

    const text = commentInputs[diaryId] || ''
    if (!text.trim()) {
      alert('請輸入留言內容！')
      return
    }

    const newComment: Comment = {
      author: loggedInUser,
      text: text.trim(),
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      timestamp: Date.now()
    }

    const newComments = [...currentComments, newComment]

    try {
      const diaryRef = doc(db, 'diaries', diaryId)
      await updateDoc(diaryRef, {
        comments: newComments
      })

      // Update local states
      const updateState = (prevList: DiaryItem[]) =>
        prevList.map(diary =>
          diary.id === diaryId
            ? { ...diary, comments: newComments }
            : diary
        )

      setPublicDiaries(prev => updateState(prev))
      setMyDiaries(prev => updateState(prev))

      // Also update activeDiary if it matches
      setActiveDiary(prev => (prev && prev.id === diaryId) ? { ...prev, comments: newComments } : prev)

      // Clear input
      setCommentInputs(prev => ({ ...prev, [diaryId]: '' }))
    } catch (e) {
      console.error('Error adding comment:', e)
      alert('留言失敗，請稍後再試。')
    }
  }

  const fetchTimeCapsules = async (email: string) => {
    try {
      const emailLower = email.trim().toLowerCase()
      const q = query(collection(db, 'time_capsules'), where('userEmail', '==', emailLower))
      const snap = await getDocs(q)
      const list: TimeCapsuleItem[] = []
      snap.forEach((d) => {
        const data = d.data()
        list.push({
          id: d.id,
          userEmail: data.userEmail,
          content: data.content,
          unlockDate: data.unlockDate,
          createdAt: data.createdAt || Date.now(),
          isOpened: !!data.isOpened
        })
      })
      list.sort((b, a) => b.createdAt - a.createdAt)
      setTimeCapsules(list)

      // ⏰ 檢查今日解鎖通知
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`

      const unlocked = list.filter(capsule => capsule.unlockDate <= todayStr && !capsule.isOpened)
      if (unlocked.length > 0) {
        setUnlockedNotifications(unlocked)
        setActiveNotificationCapsule(unlocked[0])
      }
    } catch (error) {
      console.error('Error fetching time capsules:', error)
    }
  }

  const handleOpenCapsuleNotification = async (capsule: TimeCapsuleItem) => {
    try {
      await updateDoc(doc(db, 'time_capsules', capsule.id), {
        isOpened: true
      })
      setTimeCapsules(prev => prev.map(c => c.id === capsule.id ? { ...c, isOpened: true } : c))
      const remaining = unlockedNotifications.filter(c => c.id !== capsule.id)
      setUnlockedNotifications(remaining)
      if (remaining.length > 0) {
        setActiveNotificationCapsule(remaining[0])
      } else {
        setActiveNotificationCapsule(null)
      }
      alert('已解鎖信件！您可以隨時到「時光膠囊」頁面重複閱讀這封信。')
    } catch (e) {
      console.error('Error opening capsule:', e)
      setActiveNotificationCapsule(null)
    }
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressed);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSaveDiary = async () => {
    if (!diaryTitle.trim() || !diaryContent.trim()) {
      alert('請填寫標題和內容喔！')
      return
    }
    if (!userEmail) {
      alert('請先登入帳號喔！')
      setCurrentView('login')
      return
    }
    const emailLower = userEmail.trim().toLowerCase()
    try {
      const now = Date.now()
      const diaryId = editingId || `${emailLower}_${now}`
      const today = new Date()
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

      if (isSecret && isPublic) {
        alert('日記不能同時設定為秘密和公開，請選擇一種模式。')
        return
      }
      const payload: Record<string, unknown> = {
        userEmail: emailLower,
        author: loggedInUser,
        title: diaryTitle.trim(),
        content: diaryContent.trim(),
        mood: diaryMood,
        date: dateString,
        timestamp: now,
        isSecret: isSecret || false,
        isPublic: isPublic || false,
        bgm: diaryBgm.trim(),
        photo: diaryPhoto.trim()
      }
      if (isSecret && diaryPassword.trim()) payload.password = diaryPassword.trim()

      if (editingId) {
        await updateDoc(doc(db, 'diaries', diaryId), payload)
        alert('日記更新完成！')
      } else {
        await setDoc(doc(db, 'diaries', diaryId), payload)
        alert('日記成功儲存至雲端！')
      }
      setDiaryTitle(''); setDiaryContent('')
      setIsSecret(false); setDiaryPassword(''); setEditingId(null); setIsPublic(false)
      setDiaryBgm(''); setDiaryPhoto('')
      await fetchUserDiaries(emailLower)
      setCurrentView('home')
    } catch {
      alert('儲存失敗，請確認 Firebase 資料庫 Rules 權限。')
    }
  }

  const handleDeleteDiary = async (id: string) => {
    if (!confirm('確定要刪除這篇日記嗎？此動作無法回復。')) return
    try {
      await deleteDoc(doc(db, 'diaries', id))
      if (userEmail) await fetchUserDiaries(userEmail.trim().toLowerCase())
    } catch (err) {
      console.error(err)
      alert('刪除失敗')
    }
  }

  const handleEditDiary = (d: DiaryItem) => {
    setEditingId(d.id)
    setDiaryTitle(d.title)
    setDiaryContent(d.content)
    setDiaryMood(d.mood)
    setIsSecret(!!d.isSecret)
    setDiaryPassword(d.password || '')
    setIsPublic(!!d.isPublic)
    setDiaryBgm(d.bgm || '')
    setDiaryPhoto(d.photo || '')
    setCurrentView('editor')
  }

  const handleTogglePublic = async (id: string, currentPublicStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'diaries', id), { isPublic: !currentPublicStatus })
      if (userEmail) await fetchUserDiaries(userEmail.trim().toLowerCase())
      alert(!currentPublicStatus ? '已設為公開日記，所有人都能看到！' : '已取消公開，恢復為私人日記。')
    } catch (err) {
      console.error(err)
      alert('操作失敗')
    }
  }


  const handleViewDiary = (d: DiaryItem) => {
    setActiveDiary(d)
    const showDiary = () => {
      setDiaryTitle(d.title)
      setDiaryContent(d.content)
      setDiaryMood(d.mood)
      setDiaryBgm(d.bgm || '')
      setDiaryPhoto(d.photo || '')
      setIsSecret(!!d.isSecret)
      setDiaryPassword(d.password || '')
      setIsPublic(!!d.isPublic)
      setCurrentView('viewer')
    }

    if (d.isSecret) {
      const pw = prompt('此為秘密日記，請輸入密碼以查看內容')
      if (!pw) return
      if (pw === d.password) {
        showDiary()
      } else {
        alert('密碼錯誤')
      }
    } else {
      showDiary()
    }
  }

  const handleSaveCapsule = async () => {
    if (!futureLetter.trim()) {
      alert('請寫下你想對未來自己說的話喔！')
      return
    }
    if (!userEmail) {
      alert('請先登入帳號喔！')
      setCurrentView('login')
      return
    }
    const emailLower = userEmail.trim().toLowerCase()
    try {
      const capsuleId = `${emailLower}_capsule_${Date.now()}`
      await setDoc(doc(db, 'time_capsules', capsuleId), {
        userEmail: emailLower,
        content: futureLetter.trim(),
        unlockDate: unlockDate, // YYYY-MM-DD
        createdAt: Date.now(),
        isOpened: false
      })
      alert(`封存成功！時光膠囊已安全埋下，將在 ${unlockDate} 解鎖呈現！`)
      setFutureLetter('')
      await fetchTimeCapsules(emailLower)
      setCurrentView('home')
    } catch (e) {
      console.error(e)
      alert('時光膠囊儲存失敗，請檢查權限。')
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerEmail.trim() || !registerPassword.trim() || !registerName.trim()) return
    const emailLower = registerEmail.trim().toLowerCase()
    try {
      // 檢查此 Email 是否已被註冊過
      const userDoc = await getDoc(doc(db, 'app_users', emailLower))
      if (userDoc.exists()) {
        alert('此 Email 已經被註冊過囉！')
        return
      }
      await setDoc(doc(db, 'app_users', emailLower), {
        email: emailLower, password: registerPassword.trim(), name: registerName.trim()
      })
      alert('註冊成功！')
      setCurrentView('login')
    } catch {
      alert('註冊失敗')
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword.trim()) return
    const emailLower = loginEmail.trim().toLowerCase()
    try {
      const docSnap = await getDoc(doc(db, 'app_users', emailLower))
      if (docSnap.exists() && docSnap.data().password === loginPassword.trim()) {
        const name = docSnap.data().name
        alert(`歡迎回來！`)
        localStorage.setItem('loggedInUser', name)
        localStorage.setItem('userEmail', emailLower)
        setLoggedInUser(name)
        setUserEmail(emailLower)
        await fetchUserProfile(emailLower)
        await fetchUserDiaries(emailLower)
        await fetchTimeCapsules(emailLower)
        await fetchSchedules()
        await fetchCountdownEvents()
        await fetchReviewSchedules()
        setCurrentView('home')
      } else {
        alert('密碼錯誤或帳號不存在')
      }
    } catch {
      alert('登入失敗')
    }
  }

  const moodCounts = myDiaries.reduce((acc: { [key: string]: number }, item) => {
    const m = item.mood.split(' ')[1] || item.mood;
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {})

  // 🎨 主題專屬漂浮霸氣小裝飾
  const renderThemeDecorations = () => {
    return null; // 🔥 直接一刀切，不管什麼風格通通不顯示裝飾圖案
  }

  const getCountdownString = (targetDateStr: string) => {
    const targetTime = new Date(targetDateStr).getTime()
    const diff = targetTime - currentTime
    if (diff <= 0) {
      return '🎉 活動已開始 / 已結束！'
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return `${days}天 ${hours}小時 ${minutes}分 ${seconds}秒`
  }

  // 🔄 網頁載入時自動讀取 localStorage 保持登入狀態
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail')
    fetchUsersCache()
    fetchCheers()
    fetchSchedules()
    fetchCountdownEvents()
    fetchReviewSchedules()
    if (savedEmail) {
      fetchUserDiaries(savedEmail)
      fetchTimeCapsules(savedEmail)
      fetchUserProfile(savedEmail)
    } else {
      fetchPublicDiaries()
    }

    // ⏰ 同步更新倒數時間的計時器
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderNavbar = () => {
    return (
      <>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'var(--bg-color)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          boxSizing: 'border-box',
          gap: '16px'
        }}>
          {/* 左側標題 */}
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} style={{
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap'
          }}>
            {theme === 'gd' ? '🌼 G-DRAGON // ONE OF A KIND' : theme === 'kpop' ? '🍭 TWICE // ONE IN A MILLION' : theme === 'ive' ? '💎 IVE ✨ SHOW WHAT I HAVE' : theme === 'babymonster' ? '👹 BABYMONSTER // BATTER UP' : theme === 'aespa' ? '🪐 æ-Memoir // LIVE MY LIFE' : theme === 'blackpink' ? '🖤 BLACKPINK IN YOUR AREA' : theme === 'bts' ? '💜 BTS // ARMY ' : theme === 'seventeen' ? '💎 SEVENTEEN // CARAT ' : theme === 'anime' ? '🌸 ANIME // 夢の始まり ' : 'Memoir'}
          </a>

          {/* 右側選單與功能區 */}
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '16px',
            margin: 0,
            padding: 0,
            alignItems: 'center',
            flexShrink: 0
          }}>
            <li style={{ whiteSpace: 'nowrap' }}><a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '500', fontSize: '14px' }}>首頁功能</a></li>
            <li style={{ whiteSpace: 'nowrap' }}><a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('publicWall'); }} style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>🌍 社區日記牆</a></li>
            <li style={{ whiteSpace: 'nowrap' }}><a href="#" onClick={(e) => { e.preventDefault(); if (!loggedInUser) { alert('請先登入！'); setCurrentView('login'); } else { setCurrentView('capsule'); } }} style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>📬 時光膠囊</a></li>
            <li style={{ whiteSpace: 'nowrap' }}><a href="#" onClick={(e) => { e.preventDefault(); if (!loggedInUser) { alert('請先登入！'); setCurrentView('login'); } else { setCurrentView('review'); } }} style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>📊 年度回顧</a></li>

            {/* 🏠 個人主頁 */}
            <li style={{ whiteSpace: 'nowrap' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!loggedInUser) {
                    alert('請先登入！');
                    setCurrentView('login');
                  } else {
                    setCurrentView('personalProfile');
                  }
                }}
                style={{
                  textDecoration: 'none',
                  color: 'var(--accent)',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                🏠 個人主頁
              </a>
            </li>

            {/* 🎨 風格切換 */}
            <li style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}></span>
              <select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)} style={{ padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '13px' }}>
                <option value="classic">🍂 經典暖米</option>
                <option value="blackpink">🖤 霸氣黑粉</option>
                <option value="aespa">🪐虛擬未來</option>
                <option value="kpop">🍭全員應援</option>
                <option value="gd">🌼潮流至上</option>
                <option value="ive">💎千金視覺</option>
                <option value="babymonster">😈怪物新人</option>
                <option value="bts">💜紫色星河</option>
                <option value="seventeen">💎寧靜粉藍</option>
                <option value="anime">🌸櫻花天空</option>
              </select>
            </li>

            {/* 🔐 修正後的登入狀態判斷區（直接渲染變數本身，完美解除紅線） */}
            {loggedInUser ? (
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  fontWeight: '500'
                }}>
                  <img
                    src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                    alt="avatar"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--border)'
                    }}
                  />
                  {loggedInUser}
                </span>
                <button
                  onClick={() => {
                    setNewUsername(loggedInUser);
                    setShowSettingsModal(true);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-sub)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ 設定
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-sub)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  登出
                </button>
              </li>
            ) : (
              <li style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}>
                <button
                  onClick={() => setCurrentView('login')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--accent)',
                    /* 🎨 樣式防禦：如果是 gd 主題就壓成黑色，其餘主題維持純白 */
                    color: theme === 'gd' ? '#000000 !important' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: '900', // 爆粗體，讓字體在小尺寸下依然清晰爆表
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  /* 💡 雙重保險：直接跳過權重限制，由瀏覽器最底層強行渲染黑色字體 */
                  ref={(el) => {
                    if (el) el.style.setProperty('color', theme === 'gd' ? '#000000' : '#ffffff', 'important');
                  }}
                >
                  登入 / 註冊
                </button>
              </li>
            )}
          </ul>
        </nav>
        {/* 📣 應援跑馬燈 */}
        {(() => {
          const defaultCheers = [
            { id: 'd1', author: 'Memoir', content: '快來寫下今天的日記吧！❤️' },
            { id: 'd2', author: 'BLINK', content: 'BLACKPINK FOREVER YOUNG! 🖤💗' },
            { id: 'd3', author: 'CARAT', content: 'SEVENTEEN 走花路吧！💎' },
            { id: 'd4', author: 'MY', content: 'aespa 永遠在曠野稱霸！🪐' },
            { id: 'd5', author: 'ARMY', content: '防彈少年團，我們在紫色星海等你回來！💜' }
          ];
          const marqueeItems = [...cheers, ...defaultCheers];

          return (
            <div className="cheering-ticker-container">
              {/* Left fixed badge */}
              <div style={{
                padding: '0 16px',
                background: 'var(--bg-sec)',
                zIndex: 10,
                fontWeight: 'bold',
                color: 'var(--accent)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px'
              }}>
                <span>📣</span>
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>應援牆</span>
              </div>

              {/* Center scrolling ticker */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div className="cheering-marquee-wrapper">
                  {marqueeItems.map((c, idx) => (
                    <span key={`cheer-1-${c.id}-${idx}`} className="cheering-text-item">
                      <span style={{ color: 'var(--accent)', marginRight: '4px' }}>@{c.author}</span>: {c.content}
                    </span>
                  ))}
                  {marqueeItems.map((c, idx) => (
                    <span key={`cheer-2-${c.id}-${idx}`} className="cheering-text-item">
                      <span style={{ color: 'var(--accent)', marginRight: '4px' }}>@{c.author}</span>: {c.content}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right fixed action button */}
              <div style={{
                padding: '0 16px',
                background: 'var(--bg-sec)',
                zIndex: 10,
                borderLeft: '1px solid var(--border)',
                height: '32px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => {
                    if (!loggedInUser) {
                      alert('請先登入才能留下應援話語喔！');
                      setCurrentView('login');
                    } else {
                      setNewCheerContent('');
                      setShowAddCheerModal(true);
                    }
                  }}
                  style={{
                    background: 'var(--accent)',
                    color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'transform 0.2s'
                  }}
                  ref={(el) => {
                    if (el) el.style.setProperty('color', (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff', 'important');
                  }}
                >
                  ✨ 應援
                </button>
              </div>
            </div>
          );
        })()}
      </>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('userEmail')
    setLoggedInUser(null)
    setUserEmail(null)
    setMyDiaries([])
    setTimeCapsules([])
    setUnlockedNotifications([])
    setActiveNotificationCapsule(null)
    setSchedules([])
    setCountdownEvents([])
    setReviewSchedules([])
    fetchSchedules()
    fetchCountdownEvents()
    fetchReviewSchedules()
    setCurrentView('home')
  }

  const renderGlobalModals = () => {
    return (
      <>
        {/* 🔔 時光膠囊解鎖彈出通知 Modal */}
        {activeNotificationCapsule && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              maxWidth: '500px',
              width: '100%',
              background: 'var(--bg-color)',
              border: '2px solid var(--accent)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative',
              color: 'var(--text-main)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📬</div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--accent)' }}>
                您有一封來自過去的信已解鎖！
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '24px' }}>
                這是在 {new Date(activeNotificationCapsule.createdAt).toLocaleDateString('zh-TW')} 寫給今天解鎖的時光信件
              </p>
              <div style={{
                background: 'var(--bg-sec)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'left',
                fontSize: '15px',
                lineHeight: '1.7',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                marginBottom: '30px',
                color: 'var(--text-main)'
              }}>
                {activeNotificationCapsule.content}
              </div>
              <button
                onClick={() => handleOpenCapsuleNotification(activeNotificationCapsule)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--accent)',
                  color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                ref={(el) => {
                  if (el) el.style.setProperty('color', (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff', 'important');
                }}
              >
                🔓 讀取並收入膠囊箱
              </button>
            </div>
          </div>
        )}

        {/* ⚙️ 設定 Modal */}
        {showSettingsModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>⚙️ 個人設定</h3>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>修改顯示名稱</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-sec)',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>修改個人頭像</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={newAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                    alt="Avatar Preview"
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          const base64 = await compressImage(file)
                          setNewAvatar(base64)
                        } catch (err) {
                          alert('圖片壓縮失敗')
                        }
                      }
                    }}
                    style={{ fontSize: '12px', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>修改個人簡介</label>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="介紹一下你自己吧..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-sec)',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                    resize: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-main)'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateUsername}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📣 應援留言 Modal */}
        {showAddCheerModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>📣 留下你的應援語</h3>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>應援訊息 (限 30 字)</label>
                <input
                  type="text"
                  maxLength={30}
                  value={newCheerContent}
                  onChange={(e) => setNewCheerContent(e.target.value)}
                  placeholder="例如: aespa 永遠走花路吧！❤️"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-sec)',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => setShowAddCheerModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-main)'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleAddCheer}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  應援送出
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (currentView === 'editor') {
    const isDarkTheme = (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd' || theme === 'bts');

    return (
      <>
        {renderNavbar()}
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '40px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '16px', position: 'relative' }}>
          {renderThemeDecorations()}
          <button onClick={() => { setCurrentView('home'); setEditingId(null); setIsSecret(false); setDiaryPassword(''); setIsPublic(false); setDiaryTitle(''); setDiaryContent(''); setDiaryBgm(''); setDiaryPhoto(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', marginBottom: '20px' }}>← 返回首頁</button>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkTheme ? '#ffffff' : 'var(--text-main)' }}>
              {theme === 'gd' ? '🎵 注入權志龍音樂靈魂！挑選代表你今日特立獨行態度的 GD 神曲' :
                theme === 'ive' ? '🎵 啟動耀眼高貴濾鏡！選擇契合今日大千金心情的 IVE 頂奢名曲' :
                  theme === 'babymonster' ? '🎵 猛獸出籠！選擇釋放你今日怪物實力的 BABYMONSTER 重磅黑馬歌' :
                    theme === 'blackpink' ? '🎵 生人勿近女王降臨！釋放你今日最颯、最霸氣的 BLACKPINK 狂放黑粉魂' :
                      theme === 'aespa' ? '🎵 虛擬現實同步解析！召喚你的 æ，開啟今日 aespa 曠野戰鬥模式' :
                        theme === 'kpop' ? '🎵 活力甜度大爆表！注入 TWICE 專屬滿滿多巴胺，點亮你的元氣少女心' :
                          theme === 'bts' ? '🎵 注入紫色防彈靈魂！選擇燃起你今日熱血或治癒你心靈的 BTS 神曲' :
                            theme === 'seventeen' ? '🎵 散發雙官色寧靜光芒！選擇最貼合你今日心情的 SEVENTEEN 元氣神曲' :
                              theme === 'anime' ? '🎵 青空與櫻花飛舞！選擇最契合你今日二次元日常的動漫主題歌' :
                                '🎵 今天的心情旋律 // 寫下你此時此刻的心靈協奏曲'}
            </label>

            <select value={diaryMood} onChange={(e) => setDiaryMood(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)' }}>
              {theme === 'gd' ? (
                <>
                  <option>👑 Crooked (放蕩不羈！今天就是要瘋狂宣洩)</option>
                  <option>🌼 Untitled, 2014 (無題溫柔，寫下深邃感性心聲)</option>
                  <option>⚡ One Of A Kind (潮流唯一！老子天下最帥)</option>
                  <option>🔥 Heartbreaker (震撼心碎，強烈狂放情感)</option>
                  <option>💵 Crayon (瘋狂作畫！Get Your Crayon 靈感大爆發)</option>
                </>
              ) : theme === 'ive' ? (
                <>
                  <option>✨ I AM (主角是我！自信翱翔在最高天空)</option>
                  <option>💎 LOVE DIVE (極致沉迷，勇敢跳入屬於我的絢麗愛戀)</option>
                  <option>💖 Baddie (酷辣千金，叛逆又迷人的反派角色)</option>
                  <option>👑 After LIKE (自信滿分，喜歡之後就是勇敢去愛)</option>
                  <option>💄 Eleven (十一分完美，每一步都精緻無瑕)</option>
                </>
              ) : theme === 'babymonster' ? (
                <>
                  <option>👹 SHEESH (怪物大招！全場驚嘆的震撼實力爆發)</option>
                  <option>🐾 BATTER UP (強棒出擊！新人姿態橫掃戰場)</option>
                  <option>🔥 FOREVER (永恆燃燒，充滿美式酷颯的自信光芒)</option>
                  <option>📢 LIKE THAT (美式慵懶重節奏，極致抓耳魅力)</option>
                  <option>🩸 CLIK CLAK (硬核地下饒舌，純粹嘻哈態度全開)</option>
                </>
              ) : theme === 'blackpink' ? (
                <>
                  <option>🔥 How You Like That (傲視全場！在逆境中絕地反擊、重回巔峰)</option>
                  <option>👑 Kill This Love (斬斷軟弱！大女主覺醒，揮別有毒的爛感情)</option>
                  <option>☠️ Pink Venom (致命粉紅毒蝶！優雅卻極具殺傷力的頂級魅力)</option>
                  <option>🌸 As If It's Your Last (最後初戀！拋開顧慮，今天就要愛得轟轟烈烈)</option>
                  <option>💵 Money (富婆姿態！靠自己最耀眼，今晚就是要高調奢華)</option>
                </>
              ) : theme === 'aespa' ? (
                <>
                  <option>💥 Supernova (新星爆發！我是世界的源頭，引領宇宙大爆炸)</option>
                  <option>🛸 Next Level (打破限制！越過重重難關，戰鬥力邁向下一階)</option>
                  <option>🪐 Armageddon (世界末日！在混亂中打破常規，定義我自己的真實)</option>
                  <option>🐍 Black Mamba (直面心魔！在迷惘與誘惑中保持清醒，擊碎幻象)</option>
                  <option>🌶️ Spicy (辛辣嗆爽！展現最自由不羈、熱辣肆意的夏日惡女風範)</option>
                </>
              ) : theme === 'kpop' ? ( /* TWICE */
                <>
                  <option>🍭 What is Love? (少女悸動！滿腦子粉紅泡泡，憧憬電影般的浪漫)</option>
                  <option>🏹 CHEER UP (害羞應援！元氣滿滿，大聲為自己和身邊的人加油打氣)</option>
                  <option>🚨 SIGNAL (狂發信號！心意怎麼還不相通？讓人又急又可愛的推拉)</option>
                  <option>💃 Fancy (勇敢追愛！危險又迷人，不管了、就是要直接向你奔去)</option>
                  <option>🧪 SCIENTIST (戀愛科學！別再苦苦研究心算，跟著直覺愛就對了)</option>
                </>
              ) : theme === 'bts' ? (
                <>
                  <option>💜 Dynamite (璀璨活力！像炸藥般點燃歡樂的一天)</option>
                  <option>💜 Spring Day (溫暖思念，在寒冬過後迎來春暖花開)</option>
                  <option>💜 Blood Sweat & Tears (血汗淚！極致誘惑與狂放張力)</option>
                  <option>💜 Life Goes On (溫柔治癒，無論如何生活依舊繼續)</option>
                  <option>💜 Butter (流暢融化！自信爆表、散發夏日融化魅力)</option>
                </>
              ) : theme === 'seventeen' ? (
                <>
                  <option>💎 Very Nice (Aju Nice! 活力四射，心跳加速的完美一天)</option>
                  <option>💎 Don't Wanna Cry (不想哭，在脆弱與堅強之間的感性寫照)</option>
                  <option>💎 Super (孫悟空！神仙打架，熱血沸騰、突破極限的霸氣)</option>
                  <option>💎 Circles (溫暖治癒，畫一個圈，我們終會再次相遇)</option>
                  <option>💎 Darling (甜蜜浪漫，給自己或珍貴之人的甜甜告白)</option>
                </>
              ) : theme === 'anime' ? (
                <>
                  <option>🌸 櫻花紛飛 (青春悸動，像置身動漫名場景般浪漫)</option>
                  <option>⚡ 熱血燃燒 (打倒魔王！今天戰鬥力破表，絕對不輕言放棄)</option>
                  <option>🌌 側耳傾聽 (微風吹拂，在安靜圖書館裡的一抹悠閒)</option>
                  <option>🎐 夏日祭典 (花火大會，穿上浴衣與同伴寫下青春回憶)</option>
                  <option>🍰 廢怯少女 (治癒日常，喝杯紅茶吃塊蛋糕的悠閒午後)</option>
                </>
              ) : ( /* 經典/Default */
                <>
                  <option>☀️ 陽光普照 (心情晴空萬里，對生活充滿了前行的動力)</option>
                  <option>🌿 歲月靜好 (像喝了一杯熱茶，內心無比平靜而知足)</option>
                  <option>🌧️ 孤獨雨季 (情緒有點低落，只想靜靜地跟自己相處一陣子)</option>
                  <option>🚀 滿血復活 (戰鬥力滿點！準備好去征服所有挑戰)</option>
                  <option>🌌 靈感星空 (思緒飛揚，腦海裡全是奇思妙想與未來的憧憬)</option>
                </>
              )}
            </select>
          </div>

          {/* 今日 BGM 輸入框 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkTheme ? '#ffffff' : 'var(--text-main)' }}>
              今日 BGM / 推薦歌曲
            </label>
            <input
              type="text"
              placeholder={
                theme === 'gd' ? "推薦一首 GD 的歌，如 Crooked..." :
                  theme === 'bts' ? "推薦一首 BTS 的歌，如 Dynamite..." :
                    theme === 'seventeen' ? "推薦一首 SEVENTEEN 的歌，如 Very Nice..." :
                      theme === 'anime' ? "推薦一首動漫歌，如 殘酷天使的行動綱領..." :
                        "輸入今日背景音樂歌曲..."
              }
              value={diaryBgm}
              onChange={(e) => setDiaryBgm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
            }}>
              日記標題
            </label>
            <input
              type="text"
              placeholder={
                theme === 'gd' ? "輸入充滿潮流藝術感的靈魂標題..." :
                  theme === 'ive' ? "輸入精緻高貴的大千金專屬標題..." :
                    theme === 'babymonster' ? "輸入擊碎常規的怪物新人硬核標題..." :
                      theme === 'bts' ? "輸入點燃星河的防彈天團標題..." :
                        theme === 'seventeen' ? "輸入元氣滿分的克拉應援標題..." :
                          theme === 'anime' ? "輸入青春中二的動漫主角標題..." :
                            "給今天一個標題..."
              }
              value={diaryTitle}
              onChange={(e) => setDiaryTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
            }}>
              日記內容
            </label>
            <textarea
              rows={10}
              placeholder={
                theme === 'gd' ? "揮灑你的不羈與感性，像在牆上塗鴉一樣，寫下今天最不隨波逐流的真實故事吧！" :
                  theme === 'ive' ? "讓字句閃爍鑽石般的光澤，紀錄今天那些優雅、精采且不負時光的璀璨生活碎片..." :
                    theme === 'babymonster' ? "踏著最凶狠的重低音鼓點，寫下今天那些野蠻生長、充滿野心與驚艷全場的高能瞬間！" :
                      theme === 'bts' ? "在紫色星海下，寫下你像 Dynamite 般耀眼、或如 Spring Day 般溫柔的日常足跡..." :
                        theme === 'seventeen' ? "Say the name！記錄下今天像 Aju Nice 般元氣滿分、或充滿夢想與同伴相伴的暖心瞬間..." :
                          theme === 'anime' ? "在青空與櫻花飛舞的二次元世界裡，寫下你今天熱血戰鬥、或者悠閒治癒的主角物語..." :
                            "寫下今天發生的精彩故事吧..."
              }
              value={diaryContent}
              onChange={(e) => setDiaryContent(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                boxSizing: 'border-box',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* 圖片上傳區 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkTheme ? '#ffffff' : 'var(--text-main)' }}>
              上傳/添加日記圖片
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const base64 = await compressImage(file);
                      setDiaryPhoto(base64);
                    } catch {
                      alert('圖片處理失敗');
                    }
                  }
                }}
                style={{
                  padding: '6px',
                  fontSize: '13px',
                  color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>或輸入圖片網址：</span>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={diaryPhoto}
                onChange={(e) => setDiaryPhoto(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)',
                  color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                  minWidth: '200px'
                }}
              />
            </div>
            {diaryPhoto && (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px' }}>
                <img src={diaryPhoto} alt="Preview" style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                <button
                  type="button"
                  onClick={() => setDiaryPhoto('')}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ff4d4d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
              }}>
                <input type="checkbox" checked={isSecret} onChange={(e) => {
                  const checked = e.target.checked
                  setIsSecret(checked)
                  if (checked) {
                    setIsPublic(false)
                  }
                }} /> 設為秘密日記
              </label>

              {isSecret && (
                <input
                  type="password"
                  placeholder="設定密碼以保護此日記"
                  value={diaryPassword}
                  onChange={(e) => setDiaryPassword(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: isDarkTheme ? 'rgba(255,255,255,0.15)' : 'var(--bg-color)',
                    color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
                  }}
                />
              )}

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
              }}>
                <input type="checkbox" checked={isPublic} onChange={(e) => {
                  const checked = e.target.checked
                  setIsPublic(checked)
                  if (checked) {
                    setIsSecret(false)
                    setDiaryPassword('')
                  }
                }} /> 設為公開日記
              </label>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCurrentView('home'); setEditingId(null); setIsSecret(false); setDiaryPassword(''); setIsPublic(false); setDiaryTitle(''); setDiaryContent(''); setDiaryBgm(''); setDiaryPhoto(''); }} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)' }}>取消</button>
              <button onClick={handleSaveDiary} style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{editingId ? '更新日記' : '儲存日記'}</button>
            </div>
          </div>
        </div>
        {renderGlobalModals()}
      </>
    )
  }

  if (currentView === 'capsule') {
    const getCardStyle = () => {
      switch (theme) {
        case 'blackpink':
          return {
            background: 'linear-gradient(135deg, #050505, #0b0b10)',
            backdropFilter: 'blur(16px) saturate(160%)',
            border: '1px solid rgba(240, 46, 198, 0.98)',
            boxShadow: '0 0 25px rgba(255, 0, 128, 0.95)',
            color: '#ffffff'
          };

        case 'aespa':
          return {
            background: 'linear-gradient(135deg, rgba(12,10,28,0.92), rgba(0,18,30,0.88))',
            backdropFilter: 'blur(14px) saturate(140%)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            boxShadow: '0 12px 40px rgba(6, 182, 212, 0.18), inset 0 0 25px rgba(168, 85, 247, 0.08)',
            color: '#ffffff'
          };

        case 'gd':
          return {
            background: 'linear-gradient(145deg, rgba(18,18,18,0.92), rgba(35,35,35,0.88))',
            backdropFilter: 'blur(12px) saturate(120%)',
            border: '1px solid rgba(255, 235, 59, 0.25)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            color: '#ffffff'
          };

        case 'babymonster':
          return {
            background: 'linear-gradient(135deg, #120606, #1a0a0a)',
            backdropFilter: 'blur(12px) saturate(120%)',
            border: '1px solid rgba(252, 4, 4, 0.45)',
            boxShadow: '0 15px 40px rgba(255, 23, 68, 0.18)',
            color: '#ffffff'
          };

        case 'kpop': // TWICE
          return {
            background: 'linear-gradient(135deg, #ffffff, #fff7fa)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 182, 193, 0.4)',
            boxShadow: '0 10px 30px rgba(255, 64, 129, 0.08)',
            color: '#222'
          };

        case 'ive':
          return {
            background: 'linear-gradient(135deg, #ffffff, #f7f9ff)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(225, 232, 248, 0.8)',
            boxShadow: '0 12px 35px rgba(160, 200, 255, 0.12)',
            color: '#1a1a1a'
          };

        case 'bts':
          return {
            background: 'linear-gradient(135deg, #0f081d, #1c0e3a)',
            backdropFilter: 'blur(16px) saturate(160%)',
            border: '1px solid rgba(161, 125, 240, 0.8)',
            boxShadow: '0 0 25px rgba(161, 125, 240, 0.7)',
            color: '#ffffff'
          };

        case 'seventeen':
          return {
            background: 'linear-gradient(135deg, #fdf4f5, #f0f3f9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(247, 202, 201, 0.7)',
            boxShadow: '0 10px 30px rgba(146, 168, 209, 0.25)',
            color: '#34384a'
          };

        case 'anime':
          return {
            background: 'linear-gradient(135deg, #eef7fc, #e0effa)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 127, 169, 0.5)',
            boxShadow: '0 10px 30px rgba(56, 189, 248, 0.2)',
            color: '#1e293b'
          };

        default:
          return {
            background: 'linear-gradient(135deg, var(--bg-color), #f5f5f5)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            color: 'var(--text-main)'
          };
      }
    };

    const cardStyle = getCardStyle();
    const isDark = ['blackpink', 'aespa', 'gd', 'babymonster', 'bts'].includes(theme);

    const todayStr = (() => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()

    const lockedCapsules = timeCapsules.filter(c => c.unlockDate > todayStr)
    const unlockedCapsules = timeCapsules.filter(c => c.unlockDate <= todayStr)

    return (
      <>
        {renderNavbar()}
        <div style={{
          minHeight: 'calc(100vh - 60px)',
          padding: '60px 20px',
          background: theme === 'gd' ? 'linear-gradient(135deg, #0f0f11 0%, #1a1a1f 100%)' :
            theme === 'blackpink' ? 'linear-gradient(135deg, #050505 0%, #1f0d15 100%)' :
              theme === 'aespa' ? 'linear-gradient(135deg, #060212 0%, #0d1624 100%)' :
                theme === 'kpop' ? 'linear-gradient(135deg, #fff0f5 0%, #ffe4ec 100%)' :
                  theme === 'ive' ? 'linear-gradient(135deg, #f1f4fd 0%, #e5ecfb 100%)' :
                    theme === 'babymonster' ? 'linear-gradient(135deg, #0a0505 0%, #1a0808 100%)' :
                      theme === 'bts' ? 'linear-gradient(135deg, #080410 0%, #150b26 100%)' :
                        theme === 'seventeen' ? 'linear-gradient(135deg, #fdf4f5 0%, #eef3fc 100%)' :
                          theme === 'anime' ? 'linear-gradient(135deg, #eef7fc 0%, #dbeafe 100%)' :
                            'var(--bg-color)',
          boxSizing: 'border-box',
          transition: 'all 0.5s ease'
        }}>

          {/* 📬 精緻時光膠囊卡片外殼 */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px',
            borderRadius: '24px',
            position: 'relative',
            transition: 'all 0.3s ease',
            ...cardStyle
          }}>
            {renderThemeDecorations()}

            <h2 style={{
              textAlign: 'center',
              marginBottom: '30px',
              fontWeight: '800',
              letterSpacing: '1px',
              fontSize: '24px'
            }}>
              📬 給未來自己的時光膠囊
            </h2>

            {/* 日期選擇器 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', opacity: 0.8, fontWeight: '600' }}>選擇解鎖日期</label>
              <input
                type="date"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)',
                  background: isDark ? 'rgba(255, 255, 255, 0.07)' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  boxSizing: 'border-box',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
              />
            </div>

            {/* 文字輸入框 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', opacity: 0.8, fontWeight: '600' }}>寫下你想說的話</label>
              <textarea
                rows={7}
                value={futureLetter}
                onChange={(e) => setFutureLetter(e.target.value)}
                placeholder="不論是夢想，還是悄悄話..."
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  boxSizing: 'border-box',
                  lineHeight: '1.7',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  transition: 'all 0.3s'
                }}
              />
            </div>

            {/* 封存按鈕 */}
            <button
              onClick={handleSaveCapsule}
              style={{
                width: '100%',
                padding: '15px',
                background: isDark ? 'var(--accent)' : 'var(--text-main)',
                color: isDark ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '16px',
                letterSpacing: '1px',
                boxShadow: isDark ? '0 4px 15px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              🔒 封存進時光膠囊
            </button>
          </div>

          {/* 📬 時光膠囊管理面板 */}
          <div style={{
            maxWidth: '600px',
            margin: '40px auto 0 auto',
            padding: '30px',
            borderRadius: '24px',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'var(--bg-color)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            color: 'var(--text-main)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              🕰️ 您的時光膠囊歷史
            </h3>

            {timeCapsules.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '14px', margin: '20px 0' }}>
                目前沒有封存的膠囊。寫封信寄給未來的自己吧！
              </p>
            ) : (
              <div>
                {/* 🔒 封存中（未解鎖）區塊 */}
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', margin: '15px 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span> 封存中（未解鎖）
                </h4>
                {lockedCapsules.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-sub)', margin: '0 0 20px 0', paddingLeft: '22px' }}>無</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {lockedCapsules.map((capsule) => (
                      <div key={capsule.id} style={{
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--bg-sec)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>📅 預計解鎖：{capsule.unlockDate}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>封存於 {new Date(capsule.createdAt).toLocaleDateString('zh-TW')}</span>
                        </div>
                        <div style={{
                          fontStyle: 'italic',
                          color: 'var(--text-sub)',
                          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px dashed var(--border)',
                          letterSpacing: '2px',
                          fontSize: '12px'
                        }}>
                          🔒 信件安全加密中，解鎖時間到達前無法讀取...
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 🔓 已解鎖區塊 */}
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', margin: '15px 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔓</span> 已解鎖的信件
                </h4>
                {unlockedCapsules.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-sub)', margin: '0', paddingLeft: '22px' }}>無</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {unlockedCapsules.map((capsule) => {
                      const isExpanded = expandedCapsules.includes(capsule.id);
                      return (
                        <div key={capsule.id} style={{
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--bg-sec)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.3s'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>🔓 解鎖時間：{capsule.unlockDate}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>封存於 {new Date(capsule.createdAt).toLocaleDateString('zh-TW')}</span>
                          </div>

                          {isExpanded ? (
                            <div style={{
                              background: isDark ? 'rgba(0,0,0,0.2)' : 'var(--bg-color)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '12px',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap',
                              animation: 'fadeIn 0.2s ease',
                              color: 'var(--text-main)'
                            }}>
                              {capsule.content}
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                              信件已解鎖，點選下方按鈕開啟閱讀 💌
                            </div>
                          )}

                          <button
                            onClick={() => toggleExpandCapsule(capsule.id)}
                            style={{
                              alignSelf: 'flex-end',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: '1px solid var(--accent)',
                              background: 'transparent',
                              color: 'var(--accent)',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isExpanded ? '收起信件 ✕' : '開啟信件 📖'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        {renderGlobalModals()}
      </>
    )
  }

  if (currentView === 'review') {
    // 根據不同主題定義「年度回顧卡片」的高階美學設定
    const getCardStyle = () => {
      switch (theme) {
        case 'blackpink':
          return {
            background: 'rgba(20, 20, 20, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 0, 195, 1)',
            boxShadow: '0 8px 32px rgba(255, 0, 127, 0.15)',
            color: '#ffffff',
            subCardBg: 'rgba(255, 255, 255, 0.05)'
          };
        case 'aespa':
          return {
            background: 'rgba(15, 12, 30, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2)',
            color: '#ffffff',
            subCardBg: 'rgba(255, 255, 255, 0.05)'
          };
        case 'gd':
          return {
            background: 'rgba(25, 25, 25, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 235, 59, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            color: '#ffffff',
            subCardBg: 'rgba(255, 255, 255, 0.06)'
          };
        case 'babymonster':
          return {
            background: 'rgba(20, 10, 10, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(213, 18, 18, 0.55)',
            boxShadow: '0 8px 32px rgba(233, 30, 99, 0.15)',
            color: '#ffffff',
            subCardBg: 'rgba(255, 255, 255, 0.05)'
          };
        case 'kpop': // TWICE 青春璀璨風
          return {
            background: '#ffffff',
            border: '1px solid #ffdae4',
            boxShadow: '0 10px 30px rgba(255, 64, 129, 0.1)',
            color: 'var(--text-main)',
            subCardBg: 'var(--bg-sec)'
          };
        case 'ive': // IVE 大千金高奢風
          return {
            background: '#ffffff',
            border: '1px solid #e3e8f8',
            boxShadow: '0 10px 30px rgba(0, 229, 255, 0.08)',
            color: 'var(--text-main)',
            subCardBg: 'var(--bg-sec)'
          };
        case 'bts':
          return {
            background: 'rgba(15, 8, 29, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(161, 125, 240, 0.5)',
            boxShadow: '0 8px 32px rgba(161, 125, 240, 0.2)',
            color: '#ffffff',
            subCardBg: 'rgba(255, 255, 255, 0.05)'
          };
        case 'seventeen':
          return {
            background: '#ffffff',
            border: '1px solid #f7cac9',
            boxShadow: '0 10px 30px rgba(146, 168, 209, 0.15)',
            color: '#2b3044',
            subCardBg: '#f0f3f9'
          };
        case 'anime':
          return {
            background: '#ffffff',
            border: '1px solid #ff7fa9',
            boxShadow: '0 10px 30px rgba(56, 189, 248, 0.15)',
            color: '#1e293b',
            subCardBg: '#e0effa'
          };
        default: // 經典暖米
          return {
            background: 'var(--bg-color)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            color: 'var(--text-main)',
            subCardBg: 'var(--bg-sec)'
          };
      }
    };

    const cardStyle = getCardStyle();
    const isDark = ['blackpink', 'aespa', 'gd', 'babymonster', 'bts'].includes(theme);

    const isToday = (d: Date) => {
      const today = new Date();
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    };

    const isSelected = (d: Date) => {
      if (!selectedCalendarDate) return false;
      return d.getDate() === selectedCalendarDate.getDate() &&
        d.getMonth() === selectedCalendarDate.getMonth() &&
        d.getFullYear() === selectedCalendarDate.getFullYear();
    };

    const toDiaryDateStr = (d: Date) => {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    };

    const toScheduleDateStr = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const prevMonth = () => {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(prev => prev - 1);
      } else {
        setCalendarMonth(prev => prev - 1);
      }
    };

    const nextMonth = () => {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(prev => prev + 1);
      } else {
        setCalendarMonth(prev => prev + 1);
      }
    };

    const getCalendarDays = () => {
      const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
      const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
      const prevMonthTotalDays = new Date(calendarYear, calendarMonth, 0).getDate();

      const days: { date: Date; isCurrentMonth: boolean; dateString: string }[] = [];

      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(calendarYear, calendarMonth - 1, prevMonthTotalDays - i);
        days.push({
          date: d,
          isCurrentMonth: false,
          dateString: toDiaryDateStr(d)
        });
      }

      for (let i = 1; i <= totalDays; i++) {
        const d = new Date(calendarYear, calendarMonth, i);
        days.push({
          date: d,
          isCurrentMonth: true,
          dateString: toDiaryDateStr(d)
        });
      }

      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(calendarYear, calendarMonth + 1, i);
        days.push({
          date: d,
          isCurrentMonth: false,
          dateString: toDiaryDateStr(d)
        });
      }

      return days;
    };

    return (
      <>
        {renderNavbar()}
        {/* 外層大容器：全螢幕延伸動態主題背景，完全融合首頁風格 */}
        <div style={{
          minHeight: 'calc(100vh - 60px)',
          padding: '60px 20px',
          background: theme === 'gd' ? 'linear-gradient(135deg, #0f0f11 0%, #1a1a1f 100%)' :
            theme === 'blackpink' ? 'linear-gradient(135deg, #050505 0%, #1f0d15 100%)' :
              theme === 'aespa' ? 'linear-gradient(135deg, #060212 0%, #0d1624 100%)' :
                theme === 'kpop' ? 'linear-gradient(135deg, #fff0f5 0%, #ffe4ec 100%)' :
                  theme === 'ive' ? 'linear-gradient(135deg, #f1f4fd 0%, #e5ecfb 100%)' :
                    theme === 'babymonster' ? 'linear-gradient(135deg, #0a0505 0%, #1a0808 100%)' :
                      theme === 'bts' ? 'linear-gradient(135deg, #080410 0%, #150b26 100%)' :
                        theme === 'seventeen' ? 'linear-gradient(135deg, #fdf4f5 0%, #eef3fc 100%)' :
                          theme === 'anime' ? 'linear-gradient(135deg, #eef7fc 0%, #dbeafe 100%)' :
                            'var(--bg-color)',
          boxSizing: 'border-box',
          transition: 'all 0.5s ease'
        }}>

          {/* 📊 內層高端回顧報表卡片外殼 */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px',
            borderRadius: '24px',
            position: 'relative',
            transition: 'all 0.3s ease',
            ...cardStyle
          }}>
            {renderThemeDecorations()}

            <h2 style={{
              textAlign: 'center',
              marginBottom: '35px',
              fontWeight: '800',
              fontSize: '24px',
              letterSpacing: '1px'
            }}>
              📊 {
                theme === 'gd' ? '⚡ G-DRAGON WORLD TOUR // 年終音樂特輯回顧' :
                  theme === 'ive' ? '💎 IVE THE 1ST WORLD TOUR // 璀璨星光舞台回顧' :
                    theme === 'babymonster' ? '👹 BABYMONSTER // 怪物級年終數據大賞' :
                      theme === 'aespa' ? '🪐 aespa LIVE TOUR // 曠野星際編年史' :
                        theme === 'blackpink' ? '🖤💗 BLACKPINK WORLD TOUR // 女王傳奇終章回顧' :
                          theme === 'kpop' ? '🍭 TWICE WORLD TOUR //青春璀璨回憶錄' :
                            theme === 'bts' ? '💜 BTS WORLD TOUR // 紫色星河音樂回顧' :
                              theme === 'seventeen' ? '💎 SEVENTEEN WORLD TOUR // Say the Name 克拉回憶錄' :
                                theme === 'anime' ? '🌸 ANIME RETROSPECTIVE // 櫻花飛舞的二次元編年史' :
                                  '您的年度心靈回顧報告'
              }
            </h2>

            {/* 數據網格區 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* 左側：總紀錄篇數卡片 */}
              <div style={{
                background: cardStyle.subCardBg,
                padding: '30px 24px',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.8, marginBottom: '10px' }}>總紀錄日記篇數</div>
                <div style={{ fontSize: '44px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '-1px' }}>
                  {myDiaries.length} <span style={{ fontSize: '18px', fontWeight: '700' }}>篇</span>
                </div>
              </div>

              {/* 右側：心情頻率卡片 */}
              <div style={{
                background: cardStyle.subCardBg,
                padding: '24px',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>
                  心情主打歌分佈頻率
                </div>

                {Object.entries(moodCounts).map(([mood, count]) => (
                  <div key={mood} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ width: '110px', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '500' }}>
                      {mood}
                    </span>

                    {/* 進度條背景 */}
                    <div style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.15)' : 'var(--border)', height: '10px', borderRadius: '5px', margin: '0 12px', overflow: 'hidden' }}>
                      {/* 進度條主體 */}
                      <div style={{
                        background: 'var(--accent)',
                        height: '100%',
                        borderRadius: '5px',
                        width: `${(count / (myDiaries.length || 1)) * 100}%`,
                        transition: 'width 1s ease-in-out'
                      }}></div>
                    </div>

                    <span style={{ fontSize: '13px', fontWeight: '700', width: '40px', textAlign: 'right' }}>
                      {count} 次
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* 📊 追星日記熱度貢獻圖 (Heatmap) */}
            {(() => {
              const days = [];
              const today = new Date();
              for (let i = 364; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
                days.push(d);
              }

              const formattedDateCounts: { [key: string]: number } = {};
              myDiaries.forEach((diary) => {
                if (diary.date) {
                  formattedDateCounts[diary.date] = (formattedDateCounts[diary.date] || 0) + 1;
                }
              });

              const getCellLevel = (d: Date) => {
                const formatted = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
                const count = formattedDateCounts[formatted] || 0;
                return {
                  count,
                  style: count === 0
                    ? { background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }
                    : count === 1
                      ? { background: 'var(--accent)', opacity: 0.35 }
                      : count === 2
                        ? { background: 'var(--accent)', opacity: 0.7 }
                        : { background: 'var(--accent)', opacity: 1.0 }
                };
              };

              const formatDateStr = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const date = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${date}`;
              };

              return (
                <div className="heatmap-container">
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    marginBottom: '16px',
                    textAlign: 'center',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                    <span>🔥</span> 追星日記熱度貢獻圖 (Heatmap)
                  </h3>
                  <div className="heatmap-grid-scroll">
                    <div className="heatmap-grid">
                      {days.map((day, idx) => {
                        const { count, style } = getCellLevel(day);
                        return (
                          <div
                            key={`heatmap-cell-${idx}`}
                            className="heatmap-cell"
                            style={style}
                          >
                            <span className="heatmap-tooltip">
                              {formatDateStr(day)} : {count} 篇日記
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--text-sub)',
                    marginTop: '12px'
                  }}>
                    <span>Less</span>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', opacity: 0.35 }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', opacity: 0.7 }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', opacity: 1.0 }}></div>
                    <span>More</span>
                  </div>
                </div>
              );
            })()}

            {/* 📅 年度回顧行事曆 (Annual Review Calendar) */}
            <style>{`
              .calendar-layout {
                display: grid;
                grid-template-columns: 1.2fr 1fr;
                gap: 24px;
                margin-top: 24px;
              }
              @media (max-width: 768px) {
                .calendar-layout {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            <div style={{
              marginTop: '40px',
              padding: '24px',
              background: cardStyle.subCardBg,
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)',
              borderRadius: '16px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '800',
                marginBottom: '16px',
                textAlign: 'center',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <span>📅</span> 年度回顧月曆 (新增行程不加入中控台)
              </h3>

              <div className="calendar-layout">
                {/* Left side: Calendar Grid */}
                <div className="calendar-container" style={{
                  padding: '16px',
                  background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: 'none',
                  border: 'none',
                }}>
                  {/* Calendar Header with navigation */}
                  <div className="calendar-header" style={{ marginBottom: '16px' }}>
                    <button
                      onClick={prevMonth}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                      }}
                    >
                      &lt;
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>
                      {calendarYear}年 {calendarMonth + 1}月
                    </span>
                    <button
                      onClick={nextMonth}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                      }}
                    >
                      &gt;
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="calendar-grid-header">
                    {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                      <span key={w} style={{ fontSize: '12px', opacity: 0.7 }}>{w}</span>
                    ))}
                  </div>

                  {/* Day cells grid */}
                  <div className="calendar-grid-days">
                    {getCalendarDays().map((day, idx) => {
                      const dayDiaryStr = toDiaryDateStr(day.date);
                      const daySchStr = toScheduleDateStr(day.date);

                      const dayDiaries = myDiaries.filter(d => d.date === dayDiaryStr);
                      const daySchedules = reviewSchedules.filter(sch =>
                        sch.date === daySchStr &&
                        (sch.userEmail === 'system' || (userEmail && sch.userEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()))
                      );

                      const hasDiaries = dayDiaries.length > 0;
                      const isTodayVal = isToday(day.date);
                      const isSelectedVal = isSelected(day.date);

                      return (
                        <div
                          key={`day-${idx}`}
                          onClick={() => {
                            setSelectedCalendarDate(day.date);
                            setShowAddReviewScheduleForm(false);
                          }}
                          className={`calendar-day-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${isTodayVal ? 'today' : ''}`}
                          style={{
                            borderColor: isSelectedVal ? 'var(--accent)' : undefined,
                            borderWidth: isSelectedVal ? '2px' : undefined,
                            background: isSelectedVal ? 'color-mix(in srgb, var(--accent) 15%, var(--bg-sec))' : undefined,
                            boxShadow: isSelectedVal ? '0 4px 12px rgba(var(--accent), 0.15)' : undefined,
                          }}
                        >
                          <span className="calendar-day-num" style={{
                            opacity: day.isCurrentMonth ? 1 : 0.5,
                            fontWeight: isTodayVal ? 'bold' : 'normal',
                          }}>{day.date.getDate()}</span>

                          <div className="calendar-day-dots">
                            {hasDiaries && <span className="calendar-dot diary" title="有日記" />}
                            {daySchedules.map(sch => (
                              <span key={sch.id} className={`calendar-dot ${sch.type}`} title={sch.title} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: Day Details */}
                <div style={{
                  padding: '16px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minHeight: '300px'
                }}>
                  {selectedCalendarDate ? (() => {
                    const diaryDateStr = toDiaryDateStr(selectedCalendarDate);
                    const schDateStr = toScheduleDateStr(selectedCalendarDate);

                    const dayDiaries = myDiaries.filter(d => d.date === diaryDateStr);
                    const daySchedules = reviewSchedules.filter(sch =>
                      sch.date === schDateStr &&
                      (sch.userEmail === 'system' || (userEmail && sch.userEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()))
                    );

                    return (
                      <>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)' }}>
                            📅 {selectedCalendarDate.getFullYear()}年{selectedCalendarDate.getMonth() + 1}月{selectedCalendarDate.getDate()}日 明細
                          </h4>
                        </div>

                        {/* Diaries section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>📝 當日日記 ({dayDiaries.length})</div>
                          {dayDiaries.length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-sub)', fontStyle: 'italic' }}>今天沒有寫日記喔~</div>
                          ) : (
                            dayDiaries.map(diary => (
                              <div key={diary.id} style={{
                                padding: '8px 10px',
                                background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '13px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                                  <span>{diary.title}</span>
                                  <span
                                    title={diary.mood}
                                    style={{
                                      color: 'var(--accent)',
                                      fontSize: '11px',
                                      display: 'inline-block',
                                      maxWidth: '120px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      verticalAlign: 'middle'
                                    }}
                                  >{diary.mood}</span>
                                </div>
                                <div style={{
                                  color: 'var(--text-sub)',
                                  fontSize: '12px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {diary.content}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Schedules section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>⭐ 回顧專屬行程 ({daySchedules.length})</div>
                          {daySchedules.length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-sub)', fontStyle: 'italic' }}>當天沒有設定回顧行程。</div>
                          ) : (
                            daySchedules.map(sch => {
                              let typeText = '其他';
                              let badgeColor = '#a855f7';
                              if (sch.type === 'comeback') { typeText = '💿 回歸'; badgeColor = 'var(--accent)'; }
                              else if (sch.type === 'concert') { typeText = '🎤 演唱會'; badgeColor = '#ff1744'; }
                              else if (sch.type === 'birthday') { typeText = '🎂 生日'; badgeColor = '#ff80ab'; }
                              else if (sch.type === 'show') { typeText = '📺 節目'; badgeColor = '#00e5ff'; }

                              return (
                                <div key={sch.id} style={{
                                  padding: '8px 12px',
                                  background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '13px'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{sch.title}</span>
                                    <span style={{ fontSize: '10px', color: badgeColor, fontWeight: '800' }}>{typeText}</span>
                                  </div>
                                  {loggedInUser && (
                                    <button
                                      onClick={() => handleDeleteReviewSchedule(sch.id)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ff1744',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '4px'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Add schedule form */}
                        {loggedInUser && (
                          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                            {!showAddReviewScheduleForm ? (
                              <button
                                onClick={() => setShowAddReviewScheduleForm(true)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  background: 'var(--accent)',
                                  color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  fontSize: '12.5px'
                                }}
                              >
                                ➕ 新增回顧行程
                              </button>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>新增此日行程：</div>
                                <input
                                  type="text"
                                  placeholder="行程名稱/標題"
                                  value={newReviewScheduleTitle}
                                  onChange={e => setNewReviewScheduleTitle(e.target.value)}
                                  style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-sec)',
                                    color: 'var(--text-main)',
                                    fontSize: '12px'
                                  }}
                                />
                                <select
                                  value={newReviewScheduleType}
                                  onChange={e => setNewReviewScheduleType(e.target.value as any)}
                                  style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-sec)',
                                    color: 'var(--text-main)',
                                    fontSize: '12px'
                                  }}
                                >
                                  <option value="comeback">💿 回歸/新歌發行</option>
                                  <option value="concert">🎤 演唱會/見面會</option>
                                  <option value="birthday">🎂 偶像生日</option>
                                  <option value="show">📺 綜藝/打歌節目</option>
                                  <option value="other">⭐ 其他活動</option>
                                </select>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                  <button
                                    onClick={() => setShowAddReviewScheduleForm(false)}
                                    style={{
                                      padding: '6px 12px',
                                      border: '1px solid var(--border)',
                                      borderRadius: '4px',
                                      background: 'transparent',
                                      color: 'var(--text-main)',
                                      fontSize: '11px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSaveReviewSchedule(schDateStr)}
                                    style={{
                                      padding: '6px 12px',
                                      border: 'none',
                                      borderRadius: '4px',
                                      background: 'var(--accent)',
                                      color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff',
                                      fontWeight: 'bold',
                                      fontSize: '11px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    儲存
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-sub)',
                      fontStyle: 'italic',
                      fontSize: '13px'
                    }}>
                      點選月曆日期以查看明細或新增行程
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
        {renderGlobalModals()}
      </>
    );
  }

  if (currentView === 'publicWall') {
    const isDarkTheme = (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd' || theme === 'bts');

    return (
      <>
        {renderNavbar()}
        <section style={{
          maxWidth: '1200px',
          margin: '60px auto',
          padding: '60px 20px',
          borderRadius: '24px',
          backgroundImage: theme === 'gd'
            ? `linear-gradient(to bottom, rgba(0,0,0,0.52), rgba(0,0,0,0.22)), url(${gdragonBg})`
            : theme === 'ive'
              ? `linear-gradient(to bottom, rgba(10,4,12,0.52), rgba(10,4,12,0.22)), url(${iveBg})`
              : theme === 'babymonster'
                ? `linear-gradient(to bottom, rgba(10,10,10,0.6), rgba(10,10,10,0.25)), url(${babymonsterBg})`
                : theme === 'aespa'
                  ? `linear-gradient(to bottom, rgba(8,8,20,0.55), rgba(8,8,20,0.28)), url(${aespaBg})`
                  : theme === 'blackpink'
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), url(${blackpinkBg})`
                    : theme === 'kpop'
                      ? `linear-gradient(to bottom, rgba(20,10,20,0.4), rgba(20,10,20,0.1)), url(${twiceAllMembersBg})`
                      : theme === 'bts'
                        ? `linear-gradient(to bottom, rgba(15,8,29,0.55), rgba(15,8,29,0.28)), url(${btsBg})`
                        : theme === 'seventeen'
                          ? `linear-gradient(to bottom, rgba(253,244,245,0.4), rgba(253,244,245,0.15)), url(${seventeenBg})`
                          : theme === 'anime'
                            ? `linear-gradient(to bottom, rgba(238,247,252,0.4), rgba(238,247,252,0.15)), url(${animeBg})`
                            : 'var(--bg-pattern)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 24px 80px rgba(0,0,0,0.16)'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 16px 0', color: theme === 'classic' ? 'var(--text-main)' : '#fff' }}>🌍 社區日記牆</h2>
            <p style={{ fontSize: '16px', color: theme === 'classic' ? 'var(--text-sub)' : 'rgba(255,255,255,0.82)', margin: 0 }}>歡迎瀏覽所有公開分享的日記，感受來自四面八方的故事與心情。</p>
          </div>

          {publicDiaries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-sub)' }}>
              <p style={{ fontSize: '18px' }}>還沒有公開日記呢 📝</p>
              <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>快來分享你的故事吧！</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {publicDiaries.map((diary) => (
                <div key={diary.id} style={{
                  background: theme === 'blackpink' ? 'rgba(0,0,0,0.55)' : theme === 'aespa' ? 'rgba(8,8,20,0.68)' : theme === 'gd' ? 'rgba(8,8,8,0.7)' : theme === 'bts' ? 'rgba(15,8,29,0.7)' : theme === 'ive' ? 'rgba(255,250,255,0.82)' : theme === 'babymonster' ? 'rgba(10,10,10,0.72)' : theme === 'kpop' ? 'rgba(255,245,250,0.92)' : theme === 'seventeen' ? 'rgba(255,255,255,0.85)' : theme === 'anime' ? 'rgba(255,255,255,0.85)' : 'var(--bg-sec)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  boxShadow: theme === 'classic' ? '0 4px 20px rgba(0,0,0,0.05)' : '0 6px 24px rgba(0,0,0,0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '8px' }}>
                        ✍️ {(diary.userEmail && usersCache[diary.userEmail.trim().toLowerCase()])
                          ? usersCache[diary.userEmail.trim().toLowerCase()]
                          : (diary.author && diary.author !== '匿名使用者')
                            ? diary.author
                            : (diary.userEmail ? diary.userEmail.split('@')[0] : '匿名使用者')}
                      </div>

                      <h3 style={{
                        fontSize: '18px',
                        margin: '0 0 8px 0',
                        fontWeight: '700',
                        color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                        textShadow: isDarkTheme ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                        transition: 'color 0.3s ease'
                      }}>{diary.title}</h3>

                      <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '12px' }}>📅 {diary.date}</div>
                      {diary.bgm && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                          border: '1px solid var(--border)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--accent)',
                          fontWeight: 'bold',
                          marginTop: '4px',
                          marginBottom: '8px'
                        }}>
                          🎵 {diary.bgm}
                        </div>
                      )}
                    </div>
                    <span
                      title={diary.mood}
                      style={{
                        background: ['gd', 'ive', 'babymonster', 'bts'].includes(theme) ? '#000' : 'var(--bg-color)',
                        color: theme === 'gd' ? '#ffeb3b' : theme === 'bts' ? '#a17df0' : theme === 'seventeen' ? '#f59a98' : theme === 'anime' ? '#ff7fa9' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--accent)',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                        border: theme === 'gd' ? '1px solid #ffeb3b' : theme === 'bts' ? '1px solid #a17df0' : theme === 'seventeen' ? '1px solid #f59a98' : theme === 'anime' ? '1px solid #ff7fa9' : theme === 'ive' ? '1px solid #ff4081' : theme === 'babymonster' ? '1px solid #ff1744' : '1px solid var(--border)',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle'
                      }}
                    >{diary.mood}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{diary.content}</p>

                  {diary.photo && (
                    <img src={diary.photo} alt="Diary" className="diary-photo" />
                  )}

                  {/* Likes and Comments Bar */}
                  <div className="like-comment-bar">
                    <button
                      onClick={() => handleLikeDiary(diary.id, diary.likedBy)}
                      className={`interaction-btn ${userEmail && diary.likedBy?.includes(userEmail.trim().toLowerCase()) ? 'liked' : ''}`}
                    >
                      ❤️ {diary.likes || 0}
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-sub)', fontWeight: '600' }}>
                      💬 {diary.comments?.length || 0} 留言
                    </span>
                  </div>

                  {/* Comments Panel */}
                  <div className="comments-panel">
                    {/* Comment List */}
                    {diary.comments && diary.comments.length > 0 && (
                      <div className="comment-list">
                        {diary.comments.map((comment, index) => (
                          <div key={index} className="comment-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span className="comment-author">{comment.author}</span>
                              <span className="comment-date">{comment.date}</span>
                            </div>
                            <div style={{ color: 'var(--text-main)', fontSize: '13px', wordBreak: 'break-all' }}>{comment.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="comment-input-container">
                      <input
                        type="text"
                        placeholder="寫下你的溫暖留言..."
                        className="comment-input"
                        value={commentInputs[diary.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [diary.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentDiary(diary.id, diary.comments);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleCommentDiary(diary.id, diary.comments)}
                        className="comment-submit-btn"
                        style={{
                          color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000 !important' : '#ffffff'
                        }}
                        ref={(el) => {
                          if (el) el.style.setProperty('color', (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff', 'important');
                        }}
                      >
                        傳送
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => handleViewDiary(diary)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--accent)',
                        color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000 !important' : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: '900',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        textAlign: 'center'
                      }}
                      ref={(el) => {
                        if (el) el.style.setProperty('color', (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff', 'important');
                      }}
                    >
                      閱讀完整日記
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🔮 頁尾 */}
        <footer style={{ marginTop: '80px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ textAlign: 'left' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '22px' }}>
                  Mem<em>oir</em>
                </a>
                <p style={{ fontSize: '13px', color: 'var(--text-sub)', margin: '8px 0 0 0', maxWidth: '300px' }}>
                  用音樂與文字，將你每一天的珍貴情感與旋律，安全地封存在雲端。
                </p>
              </div>
            </div>
            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', color: 'var(--text-sub)', flexWrap: 'wrap', gap: '10px' }}>
              <span>© 2026 Memoir. All rights reserved.</span>
            </div>
          </div>
        </footer>
        {renderGlobalModals()}
      </>
    );
  }

  if (currentView === 'register' || currentView === 'login') {
    return (
      <>
        {/* 🎯 終極全螢幕背景外盒：直接當作最外層，把所有人包進去！徹底吞噬 BABYMONSTER 下方的白底！ */}
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          /* 🎨 動態同步大背景底色：深色主題一路黑到底，讓下方白條無所遁形 */
          background: theme === 'blackpink'
            ? '#050207'
            : theme === 'babymonster'
              ? '#0a0508' // 完美貼合 BABYMONSTER 應援背景色！
              : theme === 'aespa'
                ? '#050714'
                : theme === 'gd'
                  ? '#0d0b0a'
                  : theme === 'bts'
                    ? '#080410'
                    : theme === 'seventeen'
                      ? '#fdf4f5'
                      : theme === 'anime'
                        ? '#eef7fc'
                        : theme === 'ive'
                          ? '#fcf8ff'
                          : theme === 'kpop'
                            ? '#f9f6f0'
                            : 'var(--global-bg)',
          transition: 'background 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}>

          {/* 💡 在這裡悄悄綁定 handleLogout，隱藏起來不影響視覺 */}
          <div style={{ display: 'none' }}>
            <button onClick={handleLogout}>隱藏的登出觸發器</button>
          </div>

          {renderNavbar()}

          {/* 📦 登入/註冊卡片置中容器（採用 flex 讓卡片在畫面上舒適地居中，圓角呈現自然） */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              maxWidth: '400px',
              margin: '0 auto', // 卡片水平置中
              padding: '40px',
              background: theme === 'kpop' ? 'linear-gradient(180deg, rgba(255, 246, 250, 0.98), rgba(255, 224, 236, 0.98))'
                : theme === 'blackpink' ? 'rgba(12, 5, 15, 0.96)'
                  : theme === 'aespa' ? 'rgba(8, 14, 32, 0.96)'
                    : theme === 'gd' ? 'rgba(16, 14, 12, 0.96)'
                      : theme === 'ive' ? 'rgba(247, 249, 255, 0.98)'
                        : theme === 'babymonster' ? 'rgba(18, 7, 12, 0.96)'
                          : theme === 'bts' ? 'rgba(14, 8, 24, 0.96)'
                            : theme === 'seventeen' ? 'rgba(253, 244, 245, 0.98)'
                              : theme === 'anime' ? 'rgba(238, 247, 252, 0.98)'
                                : 'var(--bg-color)',
              border: theme === 'kpop' ? '1px solid rgba(255, 64, 129, 0.2)' : '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: theme === 'kpop' ? '0 24px 80px rgba(255, 64, 129, 0.12)' : '0 24px 60px rgba(0,0,0,0.06)'
            }}>
              {currentView === 'register' ? (
                <form onSubmit={handleRegisterSubmit}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '24px' }}>建立您的帳號</h2>
                  <input type="text" placeholder="使用者姓名" value={registerName} onChange={(e) => setRegisterName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' || theme === 'bts' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
                  <input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' || theme === 'bts' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
                  <input type="password" placeholder="設定密碼" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' || theme === 'bts' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
                  <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>註冊帳號</button>
                  <p onClick={() => setCurrentView('login')} style={{ color: 'var(--accent)', textAlign: 'center', cursor: 'pointer', marginTop: '16px' }}>已有帳號？前往登入</p>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '24px' }}>歡迎回來</h2>
                  <input type="email" placeholder="您的 Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' || theme === 'bts' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
                  <input type="password" placeholder="輸入密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' || theme === 'bts' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />

                  <button type="submit" style={{
                    width: '100%',
                    padding: '14px',
                    background: 'var(--accent)',
                    color: theme === 'gd' ? '#000000 !important' : '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '900'
                  }}
                    ref={(el) => {
                      if (el) el.style.setProperty('color', theme === 'gd' ? '#000000' : '#ffffff', 'important');
                    }}>
                    登入系統
                  </button>

                  <p onClick={() => setCurrentView('register')} style={{
                    color: 'var(--accent)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginTop: '16px',
                    fontWeight: theme === 'gd' ? '700' : 'normal',
                    letterSpacing: '0.5px'
                  }}>
                    還沒有帳號？現在註冊
                  </p>
                </form>
              )}
            </div>
          </div>

        </div> /* 👈 整個頁面的大盒子完美閉合 */
        {renderGlobalModals()}
      </>
    )
  }
  if (currentView === 'viewer') {
    const isDarkTheme = (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd' || theme === 'bts');
    return (
      <>
        {renderNavbar()}
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '40px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '16px', position: 'relative' }}>
          {renderThemeDecorations()}
          <button onClick={() => { setCurrentView('home'); setEditingId(null); setIsSecret(false); setDiaryPassword(''); setIsPublic(false); setDiaryTitle(''); setDiaryContent(''); setDiaryBgm(''); setDiaryPhoto(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', marginBottom: '20px' }}>← 返回首頁</button>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkTheme ? '#ffffff' : 'var(--text-main)' }}>
              今日心情與歌曲
            </label>
            <select disabled value={diaryMood} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)', opacity: 0.8 }}>
              <option>{diaryMood}</option>
            </select>
          </div>

          {diaryBgm && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkTheme ? '#ffffff' : 'var(--text-main)' }}>
                今日 BGM / 推薦歌曲
              </label>
              <input
                disabled
                type="text"
                value={diaryBgm}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'var(--bg-sec)',
                  color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                  boxSizing: 'border-box',
                  opacity: 0.8
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
            }}>
              日記標題
            </label>
            <input
              disabled
              type="text"
              value={diaryTitle}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'var(--bg-sec)',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                boxSizing: 'border-box',
                opacity: 0.8
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: isDarkTheme ? '#ffffff' : 'var(--text-main)'
            }}>
              日記內容
            </label>
            <textarea
              disabled
              rows={10}
              value={diaryContent}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'var(--bg-sec)',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                boxSizing: 'border-box',
                lineHeight: '1.6',
                opacity: 0.8
              }}
            />
          </div>

          {diaryPhoto && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkTheme ? '#ffffff' : 'var(--text-main)' }}>
                日記圖片
              </label>
              <img src={diaryPhoto} alt="Diary content" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          )}

          {/* Likes & Comments inside the Viewer (if it is a public diary) */}
          {activeDiary && isPublic && (
            <div style={{ marginBottom: '24px' }}>
              {/* Likes and Comments Bar */}
              <div className="like-comment-bar" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <button
                  onClick={() => handleLikeDiary(activeDiary.id, activeDiary.likedBy)}
                  className={`interaction-btn ${userEmail && activeDiary.likedBy?.includes(userEmail.trim().toLowerCase()) ? 'liked' : ''}`}
                >
                  ❤️ {activeDiary.likes || 0}
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text-sub)', fontWeight: '600' }}>
                  💬 {activeDiary.comments?.length || 0} 留言
                </span>
              </div>

              {/* Comments Panel */}
              <div className="comments-panel" style={{ marginTop: '12px' }}>
                {/* Comment List */}
                {activeDiary.comments && activeDiary.comments.length > 0 && (
                  <div className="comment-list" style={{ maxHeight: '240px' }}>
                    {activeDiary.comments.map((comment, index) => (
                      <div key={index} className="comment-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span className="comment-author">{comment.author}</span>
                          <span className="comment-date">{comment.date}</span>
                        </div>
                        <div style={{ color: 'var(--text-main)', fontSize: '13px', wordBreak: 'break-all' }}>{comment.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                <div className="comment-input-container">
                  <input
                    type="text"
                    placeholder="寫下你的溫暖留言..."
                    className="comment-input"
                    value={commentInputs[activeDiary.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [activeDiary.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCommentDiary(activeDiary.id, activeDiary.comments);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleCommentDiary(activeDiary.id, activeDiary.comments)}
                    className="comment-submit-btn"
                    style={{
                      color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000 !important' : '#ffffff'
                    }}
                    ref={(el) => {
                      if (el) el.style.setProperty('color', (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff', 'important');
                    }}
                  >
                    傳送
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                opacity: 0.8
              }}>
                <input disabled type="checkbox" checked={isSecret} /> 設為秘密日記
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                opacity: 0.8
              }}>
                <input disabled type="checkbox" checked={isPublic} /> 設為公開日記
              </label>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCurrentView('home'); setEditingId(null); setIsSecret(false); setDiaryPassword(''); setIsPublic(false); setDiaryTitle(''); setDiaryContent(''); setDiaryBgm(''); setDiaryPhoto(''); setActiveDiary(null); }} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)', cursor: 'pointer' }}>返回首頁</button>
            </div>
          </div>
        </div>
        {renderGlobalModals()}
      </>
    )
  }

  if (currentView === 'personalProfile') {
    const isDark = ['blackpink', 'aespa', 'gd', 'babymonster', 'bts'].includes(theme);
    const publicDiariesCount = myDiaries.filter(d => d.isPublic).length;
    const secretDiariesCount = myDiaries.filter(d => d.isSecret).length;

    return (
      <>
        {renderNavbar()}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500;700&family=Caveat:wght@400;600&display=swap');

          .diary-profile-page {
            min-height: calc(100vh - 60px);
            padding: 40px 20px 80px;
            box-sizing: border-box;
            transition: all 0.5s ease;
          }

          .diary-cover {
            max-width: 760px;
            margin: 0 auto 48px;
            border-radius: 16px;
            overflow: hidden;
            border-left: 6px solid var(--accent);
            display: flex;
            position: relative;
          }

          .diary-spine {
            width: 32px;
            background: var(--accent);
            opacity: 0.12;
            flex-shrink: 0;
          }

          .diary-cover-inner {
            flex: 1;
            padding: 36px 32px 32px 24px;
          }

          .diary-header-row {
            display: flex;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .diary-avatar-frame {
            position: relative;
            flex-shrink: 0;
          }

          .diary-avatar-frame img {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid var(--accent);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            display: block;
          }

          .diary-avatar-stamp {
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
          }

          .diary-user-info {
            flex: 1;
          }

          .diary-username {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
            color: var(--text-main);
            line-height: 1.2;
            font-family: 'Noto Serif TC', serif;
          }

          .diary-sub-label {
            font-size: 14px;
            color: var(--text-sub);
            margin-bottom: 14px;
            font-family: 'Caveat', cursive;
            letter-spacing: 1px;
          }

          .diary-edit-btn {
            padding: 6px 16px;
            border-radius: 20px;
            border: 1.5px solid var(--accent);
            background: transparent;
            color: var(--accent);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Noto Serif TC', serif;
          }
          .diary-edit-btn:hover {
            background: var(--accent);
            color: #fff;
          }

          .diary-bio-block {
            border-left: 3px solid var(--accent);
            padding: 10px 0 10px 16px;
            margin-bottom: 24px;
            font-size: 15px;
            line-height: 1.8;
            color: var(--text-main);
            white-space: pre-wrap;
            font-style: italic;
            font-family: 'Noto Serif TC', serif;
          }

          .diary-stats-row {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }

          .diary-stat-chip {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-radius: 12px;
            padding: 10px 18px;
            min-width: 72px;
          }

          .diary-stat-num {
            font-size: 22px;
            font-weight: 700;
            color: var(--accent);
            line-height: 1;
            font-family: 'Caveat', cursive;
          }

          .diary-stat-label {
            font-size: 11px;
            color: var(--text-sub);
            margin-top: 4px;
            letter-spacing: 0.5px;
          }

          .diary-section-label {
            max-width: 760px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: var(--text-sub);
            font-family: 'Caveat', cursive;
            font-size: 16px;
          }

          .diary-section-label::before,
          .diary-section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
          }

          .diary-entries-list {
            max-width: 960px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
            padding: 20px 4px;
          }

          .diary-entry-card {
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }

          .diary-entry-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
          }

          .diary-card-header {
            position: relative;
            height: 150px;
            width: 100%;
            overflow: hidden;
            flex-shrink: 0;
          }

          .diary-card-cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s ease;
          }

          .diary-entry-card:hover .diary-card-cover-img {
            transform: scale(1.06);
          }

          .diary-card-cover-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--bg-sec) 100%);
            opacity: 0.85;
          }

          .diary-card-date-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(4px);
            color: #fff;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            z-index: 2;
          }

          .diary-card-body {
            flex: 1;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 120px;
          }

          .diary-card-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-main);
            margin: 0 0 6px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Noto Serif TC', serif;
          }

          .diary-card-excerpt {
            font-size: 12px;
            color: var(--text-sub);
            line-height: 1.5;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            flex-grow: 1;
          }

          .diary-card-footer {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
            font-size: 11px;
            color: var(--text-sub);
            border-top: 1px solid var(--border);
            padding-top: 8px;
            flex-wrap: wrap;
          }

          .diary-entry-secret-badge {
            padding: 2px 8px;
            border-radius: 8px;
            background: rgba(220,30,30,0.08);
            color: #e05555;
            font-size: 11px;
            font-weight: 600;
          }

          .diary-empty-state {
            text-align: center;
            padding: 80px 20px;
            color: var(--text-sub);
          }

          .diary-empty-icon {
            font-size: 56px;
            margin-bottom: 16px;
            opacity: 0.5;
          }

          @media (max-width: 600px) {
            .diary-header-row { gap: 16px; }
            .diary-cover-inner { padding: 20px 14px 18px; }
            .diary-entry-date-col { width: 54px; }
            .diary-entry-day { font-size: 22px; }
          }
        `}</style>

        <div
          className="diary-profile-page"
          style={{
            background: theme === 'gd' ? 'linear-gradient(135deg, #0f0c1a 0%, #1a1626 100%)' :
              theme === 'blackpink' ? 'linear-gradient(135deg, #050505 0%, #1f0d15 100%)' :
                theme === 'aespa' ? 'linear-gradient(135deg, #060212 0%, #0d1624 100%)' :
                  theme === 'kpop' ? 'linear-gradient(135deg, #fff8f2 0%, #ffeee4 100%)' :
                    theme === 'ive' ? 'linear-gradient(135deg, #f3f6fd 0%, #eaf0fb 100%)' :
                      theme === 'babymonster' ? 'linear-gradient(135deg, #0a0505 0%, #1a0808 100%)' :
                        theme === 'bts' ? 'linear-gradient(135deg, #080410 0%, #150b26 100%)' :
                          theme === 'seventeen' ? 'linear-gradient(135deg, #fdf4f5 0%, #eef3fc 100%)' :
                            theme === 'anime' ? 'linear-gradient(135deg, #eef7fc 0%, #dbeafe 100%)' :
                              'var(--bg-color)',
            color: 'var(--text-main)'
          }}
        >
          {/* ── 日記封面卡片 ── */}
          <div
            className="diary-cover"
            style={{
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                : 'linear-gradient(145deg, #fffdf7, #f7f0e4)',
              boxShadow: isDark
                ? '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
                : '0 20px 60px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div className="diary-spine" />
            <div className="diary-cover-inner">
              <div className="diary-header-row">
                {/* 頭像 */}
                <div className="diary-avatar-frame">
                  <img
                    src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                    alt="Avatar"
                  />
                  <div className="diary-avatar-stamp">📖</div>
                </div>

                {/* 用戶資訊 */}
                <div className="diary-user-info">
                  <h1 className="diary-username">{loggedInUser || '使用者'}</h1>
                  <div className="diary-sub-label">✦ 我的日記空間 ✦</div>
                  <button
                    className="diary-edit-btn"
                    onClick={() => {
                      setNewUsername(loggedInUser || '');
                      setNewBio(userBio);
                      setNewAvatar(userAvatar);
                      setShowSettingsModal(true);
                    }}
                  >
                    ✎ 編輯個人主頁
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div
                className="diary-bio-block"
                style={{ opacity: userBio ? 1 : 0.38 }}
              >
                {userBio || '還沒有留下任何自我介紹… 點擊上方按鈕來填寫吧 ✨'}
              </div>

              {/* 統計 */}
              <div className="diary-stats-row">
                <div
                  className="diary-stat-chip"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
                  }}
                >
                  <span className="diary-stat-num">{myDiaries.length}</span>
                  <span className="diary-stat-label">日記篇數</span>
                </div>
                <div
                  className="diary-stat-chip"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
                  }}
                >
                  <span className="diary-stat-num">{publicDiariesCount}</span>
                  <span className="diary-stat-label">公開日記</span>
                </div>
                <div
                  className="diary-stat-chip"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
                  }}
                >
                  <span className="diary-stat-num">{secretDiariesCount}</span>
                  <span className="diary-stat-label">秘密日記</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 日記列表標題 ── */}
          <div className="diary-section-label">✦ 我的日記列表 ✦</div>

          {/* ── 日記列表 ── */}
          {myDiaries.length === 0 ? (
            <div className="diary-empty-state">
              <div className="diary-empty-icon">📔</div>
              <p style={{ fontSize: '16px', fontStyle: 'italic' }}>這裡還很安靜，快來寫下第一篇日記吧</p>
            </div>
          ) : (
            <div className="diary-entries-list">
              {[...myDiaries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((diary) => {
                  const hasPhoto = !!diary.photo;
                  const excerpt = diary.isSecret
                    ? "🔒 這是一篇秘密日記，請點擊輸入密碼閱讀。"
                    : (diary.content ? diary.content.replace(/<[^>]*>/g, '').slice(0, 80) : '');
                  return (
                    <div
                      key={diary.id}
                      className="diary-entry-card"
                      onClick={() => handleViewDiary(diary)}
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                          : 'linear-gradient(135deg, #fffdf7, #f9f5ea)',
                        border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.06)'
                      }}
                    >
                      {/* Card Cover (Photo or Mood Placeholder) */}
                      <div className="diary-card-header">
                        <div className="diary-card-date-badge">
                          📅 {diary.date}
                        </div>
                        {hasPhoto ? (
                          <img
                            className="diary-card-cover-img"
                            src={diary.photo}
                            alt="封面"
                          />
                        ) : (
                          <div className="diary-card-cover-placeholder">
                            {diary.mood?.split(' ')[0] || '📔'}
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="diary-card-body">
                        <div className="diary-card-title" title={diary.title}>{diary.title}</div>
                        {excerpt && (
                          <p className="diary-card-excerpt">{excerpt}</p>
                        )}
                        <div className="diary-card-footer">
                          <span>{diary.mood?.split(' ')[0]}</span>
                          <span>❤️ {diary.likes || 0}</span>
                          <span>💬 {diary.comments?.length || 0}</span>
                          {diary.isSecret && (
                            <span className="diary-entry-secret-badge">🔒 私密</span>
                          )}
                          {diary.isPublic && (
                            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>🌍 公開</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        {renderGlobalModals()}
      </>
    );
  }


  const isDarkTheme = (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd' || theme === 'bts');

  return (
    <>
      {renderNavbar()}

      {/* 🚀 HERO 主頁區塊 */}
      <section
        className="hero"
        style={{
          position: 'relative',
          backgroundImage: theme === 'gd'
            ? `linear-gradient(to bottom, rgba(15,15,15,0.65), rgba(25,20,10,0.9)), url(${gdragonBg})`
            : theme === 'ive'
              ? `linear-gradient(to bottom, rgba(255,240,245,0.55), rgba(230,245,255,0.78)), url(${iveBg})`
              : theme === 'babymonster'
                ? `linear-gradient(to bottom, rgba(20,5,5,0.6), rgba(15,5,5,0.92)), url(${babymonsterBg})`
                : theme === 'aespa'
                  ? `linear-gradient(to bottom, rgba(13,10,30,0.5), rgba(15,10,25,0.85)), url(${aespaBg})`
                  : theme === 'blackpink'
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(20,20,20,0.85)), url(${blackpinkBg})`
                    : theme === 'kpop'
                      ? `linear-gradient(180deg, rgba(255, 247, 251, 0.55) 0%, rgba(255, 233, 242, 0.6) 50%, rgba(255, 213, 232, 0.7) 100%), url(${twiceAllMembersBg})`
                      : theme === 'bts'
                        ? `linear-gradient(to bottom, rgba(15,8,29,0.65), rgba(25,12,45,0.9)), url(${btsBg})`
                        : theme === 'seventeen'
                          ? `linear-gradient(to bottom, rgba(253,244,245,0.55), rgba(240,243,249,0.78)), url(${seventeenBg})`
                          : theme === 'anime'
                            ? `linear-gradient(to bottom, rgba(238,247,252,0.55), rgba(224,239,250,0.78)), url(${animeBg})`
                            : 'var(--bg-pattern)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          minHeight: theme === 'gd' || theme === 'bts' ? '100vh' : '75vh',
          backgroundAttachment: theme === 'gd' || theme === 'bts' ? 'fixed' : 'scroll',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          padding: '20px'
        }}
      >
        {renderThemeDecorations()}

        <div className="eyebrow" style={{
          background: theme === 'gd' ? '#ffeb3b' : theme === 'bts' ? '#a17df0' : theme === 'seventeen' ? 'linear-gradient(90deg, #f7cac9, #92a8d1)' : theme === 'anime' ? 'linear-gradient(90deg, #ff7fa9, #38bdf8)' : theme === 'ive' ? 'linear-gradient(90deg, #ff80ab, #00e5ff)' : theme === 'babymonster' ? '#ff1744' : theme === 'aespa' ? 'linear-gradient(90deg, #a855f7, #06b6d4)' : theme === 'blackpink' ? '#ff007f' : 'rgba(0,0,0,0.05)',
          color: theme === 'gd' ? '#000' : (theme === 'ive' || theme === 'babymonster' || theme === 'aespa' || theme === 'blackpink' || theme === 'bts') ? '#fff' : 'var(--text-main)',
          fontWeight: 'bold'
        }}>
          <div className="eyebrow-dot" style={{ backgroundColor: theme === 'gd' ? '#000' : '#fff' }}></div>
          {theme === 'gd' ? (
            "🌼 COUP D'ETAT！G-DRAGON 潮流藝術脈絡同步中"
          ) : theme === 'ive' ? (
            "✨ WHAT'S AFTER LIKE? IVE 閃耀大千金秀台已就位"
          ) : theme === 'babymonster' ? (
            "😈 ATTENTION！BABYMONSTER 怪物新人重磅音浪突襲"
          ) : theme === 'aespa' ? (
            "🪐 Welcome to KWANGYA！aespa 虛擬同步網絡已對接"
          ) : theme === 'blackpink' ? (
            "🖤 BLACKPINK IN YOUR AREA！BLINK 烈焰重低音模組已啟動"
          ) : theme === 'kpop' ? (
            "🍭 ONE IN A MILLION！TWICE 9人全員應援板已聯動"
          ) : theme === 'bts' ? (
            "💜 BORN TO BE DYNAMITE！BTS 應援星光舞台已點亮"
          ) : theme === 'seventeen' ? (
            "💎 SAY THE NAME！SEVENTEEN 雙官色克拉矩陣已聯動"
          ) : theme === 'anime' ? (
            "🌸 櫻花飛舞的青空之下！日本動漫日常物語溫馨加載中"
          ) : (
            "📜 MEMOIR SYSTEM ｜ 經典暖米時光溫柔載入中，靜候你的日常篇章"
          )}
        </div>

        <h1 className="fade-up visible" style={{
          textAlign: 'center',
          color: (theme === 'classic' || theme === 'seventeen' || theme === 'anime') ? 'var(--text-main)' : '#fff',
          fontFamily: '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif',
          letterSpacing: '1px'
        }}>
          {theme === 'gd' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900' }}>Wild & Young！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#ffeb3b', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 20px rgba(255,235,59,0.5)' }}>🌼 寫下不隨波逐流的權志龍狂放詩篇</em>
            </>
          ) : theme === 'bts' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900', textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)' }}>Love Yourself！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#a17df0', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 20px rgba(161,125,240,0.6)' }}>💜 在紫色星海中留下你 Dynamite 般的燦爛印記</em>
            </>
          ) : theme === 'seventeen' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900', textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>Aju Nice！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#f27270ff', fontStyle: 'italic', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 255, 255, 0.9)' }}>💎 Say the Name！與十七位少年寫下克拉的溫暖閃耀瞬間</em>
            </>
          ) : theme === 'anime' ? (
            <>
              <span style={{ fontFamily: '"Noto Sans TC", sans-serif', fontWeight: '900' }}>青空之下，櫻花飄落</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#ef2166ff', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 15px rgba(255,127,169,0.6)' }}>🌸 寫下專屬於你的青春主角日常物語</em>
            </>
          ) : theme === 'kpop' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900', textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.3)' }}>ONE IN A MILLION！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#5c0632', fontStyle: 'italic', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 255, 255, 0.9), 1px 1px 3px rgba(0, 0, 0, 0.5)' }}>
                🍭 點亮 Candy Bong 留下我們珍貴的 Shining Moment
              </em>
            </>
          ) : theme === 'ive' ? (
            <>
              <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: '700', textShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 12px rgba(0, 50, 150, 0.3)' }}>That's My Style！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#ff4081', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 20px rgba(255,64,129,0.4), 1px 1px 2px rgba(0,0,0,0.3)' }}>
                💎 鐫刻精緻耀眼的高貴千金生活誌
              </em>
            </>
          ) : theme === 'babymonster' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900' }}>Caught My Eye！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#ff1744', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 25px rgba(255,23,68,0.7)' }}>😈 釋放摧枯拉朽的怪物新人黑馬紀錄</em>
            </>
          ) : theme === 'aespa' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900' }}>Su-Su-Supernova！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#00ffff', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 25px rgba(0,255,255,0.8)' }}>🪐 跨越次元編譯你的超現實回憶</em>
            </>
          ) : theme === 'blackpink' ? (
            <>
              <span style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontWeight: '900',
                fontSize: '4.2rem',
                letterSpacing: '2px',
                textShadow: '0 4px 15px rgba(0,0,0,0.6), 0 0 25px rgba(255,0,127,0.5)'
              }}>
                Born Pink！
              </span>
              <br />
              <em style={{
                fontSize: '1.3rem',
                color: '#ff007f',
                fontStyle: 'italic',
                fontWeight: '900',
                letterSpacing: '3px',
                textShadow: '0 0 15px rgba(255,0,127,0.8), 0 0 30px rgba(255,0,127,0.4), 2px 2px 4px rgba(0,0,0,0.6)'
              }}>
                🔥 撰寫統治全場的女王日記
              </em>
            </>
          ) : (
            <>
              寫下你每日的心得吧!
              <br />
              <em style={{ fontSize: '1.3rem', fontStyle: 'italic' }}>✨ 留下我們珍貴的 Shining Moment</em>
            </>
          )}
        </h1>

        <p className="hero-sub fade-up visible" style={{
          textAlign: 'center',
          maxWidth: '650px',
          lineHeight: '1.8',
          fontSize: '17px',
          fontWeight: '600',
          color: (theme === 'classic' || theme === 'seventeen' || theme === 'anime') ? 'var(--text-main)' : '#ffffff',
          textShadow: (theme === 'classic' || theme === 'seventeen' || theme === 'anime')
            ? 'none'
            : theme === 'gd'
              ? '0 2px 10px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)'
              : theme === 'ive'
                ? '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)'
                : theme === 'babymonster'
                  ? '0 2px 10px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)'
                  : theme === 'aespa'
                    ? '0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)'
                    : '0 2px 8px rgba(0,0,0,0.8)'
        }}
        >
          {theme === 'gd' ? (
            "「八九不離十，我是唯一的潮流」— 踏入 GD 的黑金高街實驗室，像揮灑噴漆一般，留住你最特立獨行、不可一世的靈魂印記。"
          ) : theme === 'bts' ? (
            "「在紫色星河的擁抱下，我們與你同在」— 點亮阿米棒的紫色星海，在這裡記錄你每一天像 Dynamite 般璀璨或如 Spring Day 般溫馨的閃耀回憶。"
          ) : theme === 'seventeen' ? (
            "「Say the Name！用溫暖的粉藍色，編織專屬克拉與少年的回憶」— 感受 SEVENTEEN 溫暖元氣，在這裡寫下生活中的每一分美好與小確幸。"
          ) : theme === 'anime' ? (
            "「櫻花瓣落下的速度是秒速五厘米」— 走進夢幻二次元青空，在這裡記錄下你作為青春日常番或熱血冒險番主角的暖心日常物語。"
          ) : theme === 'ive' ? (
            "「我就像鑽石，無懈可擊」— 啟動張員瑛式的美學視角，讓你的日常日記充斥精緻蝴蝶結與奢華光芒，你就是生活的 C 位大千金。"
          ) : theme === 'babymonster' ? (
            "「天生怪獸，天生狠角色」— 承襲美式硬核嘻哈的大勢力量，點燃你體內不服輸的怪物基因，在這裡寫下燃炸全場的新人傳奇。"
          ) : theme === 'aespa' ? (
            "「打破邊界，定義未來」— 穿越現實與虛擬交錯的世界，在這裡記錄每一次突破自我、每一次勇敢升級，寫下專屬於你的未來篇章。"
          ) : theme === 'blackpink' ? (
            "「頂峰相見，無人能擋」— 帶上你的粉紅應援氣球槌，在這裡刻下最具野心、最不服輸且充滿光芒的震撼瞬間。"
          ) : theme === 'kpop' ? (
            "「只要我們在一起，就是 ONE IN A MILLION」— 點亮甜蜜的 Candy Bong 應援光芒，在這裡用滿滿電能，記錄下九位女孩與你最珍貴的閃耀瞬間。"
          ) : (
            "「留住歲月裡的溫柔」— 靜下心來，把平凡的日常慢慢鋪陳，在這裡將每一段恬靜的時光寫成最精緻、最溫暖的詩篇。"
          )}
        </p>

        <div className="hero-actions">
          <a href="#" className="btn-hero btn-hero-primary"
            style={{
              background:
                theme === 'gd' ? '#ffeb3b' :
                  theme === 'bts' ? '#a17df0' :
                    theme === 'seventeen' ? '#f59a98' :
                      theme === 'anime' ? '#ff7fa9' :
                        theme === 'ive' ? '#ff4081' :
                          theme === 'babymonster' ? '#ff1744' :
                            theme === 'aespa' ? 'linear-gradient(135deg, #a855f7, #06b6d4)' :
                              theme === 'blackpink' ? '#ff007f' :
                                'var(--accent)',
              color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000' : '#fff',
              border: 'none'
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!loggedInUser) {
                alert('請先登入帳號喔！');
                setCurrentView('login');
              } else {
                setCurrentView('editor');
              }
            }}
          >
            {theme === 'gd' ? '🎨 狂傲揮灑 藝術寫日記' :
              theme === 'bts' ? '💜 紫色星夜 防彈寫日記' :
                theme === 'seventeen' ? '💎 閃耀克拉 元氣寫日記' :
                  theme === 'anime' ? '🌸 櫻花飄落 青春寫日記' :
                    theme === 'ive' ? '👑 優雅登台 千金寫日記' :
                      theme === 'babymonster' ? '🩸 猛獸暴走 怪物寫日記' :
                        theme === 'aespa' ? '🚀 穿越 KWANGYA 未來寫日記' :
                          theme === 'blackpink' ? '🖤💗 女王降臨 Born Pink寫日記' :
                            theme === 'kpop' ? '🍭 心動滿分 青春寫日記' :
                              '開始寫日記'}
          </a>

          <a href="#" className="btn-hero btn-hero-secondary"
            style={{
              background:
                (theme === 'gd' || theme === 'ive' || theme === 'babymonster' || theme === 'aespa' || theme === 'blackpink' || theme === 'bts')
                  ? '#000'
                  : 'var(--bg-sec)',
              color:
                theme === 'gd' ? '#ffeb3b' :
                  theme === 'bts' ? '#a17df0' :
                    theme === 'seventeen' ? '#f59a98' :
                      theme === 'anime' ? '#ff7fa9' :
                        theme === 'ive' ? '#ff4081' :
                          theme === 'babymonster' ? '#ff1744' :
                            theme === 'aespa' ? '#00ffff' :
                              theme === 'blackpink' ? '#ff007f' :
                                'var(--text-main)',
              border:
                theme === 'gd' ? '1px solid #ffeb3b' :
                  theme === 'bts' ? '1px solid #a17df0' :
                    theme === 'seventeen' ? '1px solid #f59a98' :
                      theme === 'anime' ? '1px solid #ff7fa9' :
                        theme === 'ive' ? '1px solid #ff4081' :
                          theme === 'babymonster' ? '1px solid #ff1744' :
                            theme === 'aespa' ? '1px solid #00ffff' :
                              theme === 'blackpink' ? '1px solid #ff007f' :
                                '1px solid var(--border)'
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!loggedInUser) {
                alert('請先登入帳號喔！');
                setCurrentView('login');
              } else {
                setCurrentView('review');
              }
            }}
          >
            {theme === 'gd' ? '⚡ 讀取 無題 潮流舞台編年史' :
              theme === 'bts' ? '✨ 收藏 Dynamite 璀璨舞台回顧' :
                theme === 'seventeen' ? '💎 開啟 Aju Nice 克拉熱血舞台回顧' :
                  theme === 'anime' ? '🌸 走進 櫻花飛舞 青春二次元回顧' :
                    theme === 'ive' ? '🎀 開啟 I AM 耀眼璀璨回顧' :
                      theme === 'babymonster' ? '📢 觀看 SHEESH 怪物進化軌跡' :
                        theme === 'aespa' ? '🌌 解鎖 Supernova 星際成長紀錄' :
                          theme === 'blackpink' ? '✨ 翻閱 Born Pink 女王傳奇篇章' :
                            theme === 'kpop' ? '💝 收藏 ONE SPARK 青春回憶錄' :
                              '看年度回顧'}
          </a>
        </div>
      </section>

      {/* 📅 K-Pop 追星中控台 (K-Pop Schedule & Countdown Dashboard) */}
      <section style={{
        maxWidth: '960px',
        margin: '40px auto 0 auto',
        padding: '0 24px',
        boxSizing: 'border-box',
        background: 'transparent'
      }}>
        <div
          className="kpop-dashboard-container"
          style={{
            background: isDarkTheme ? 'rgba(20, 15, 30, 0.55)' : 'rgba(255, 255, 255, 0.8)',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)'}`,
            borderRadius: '28px',
            padding: '36px',
            backdropFilter: 'blur(20px)',
            boxShadow: isDarkTheme
              ? '0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 30px 70px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}
        >

          <h2 style={{
            fontSize: '22px',
            fontWeight: '900',
            marginBottom: '32px',
            textAlign: 'center',
            color: 'var(--accent)',
            letterSpacing: '0.5px'
          }}>
            📅 追星應援中控台
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px'
          }}>

            {/* Left side: Countdown Timer */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `2px solid ${isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                paddingBottom: '12px'
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <span style={{ fontSize: '18px' }}>⏳</span> 活動與回歸倒數
                </h3>
                {loggedInUser && (
                  <button
                    onClick={() => {
                      setNewCountdownTitle('');
                      setNewCountdownDate('');
                      setShowAddCountdownModal(true);
                    }}
                    className="kpop-btn-add"
                    style={{
                      background: theme === 'gd'
                        ? '#ffeb3b'
                        : theme === 'seventeen'
                          ? 'linear-gradient(135deg, #f7cac9, #92a8d1)'
                          : theme === 'anime'
                            ? '#ff7fa9'
                            : 'linear-gradient(135deg, var(--accent), #ff4081)',
                      color: (theme === 'gd' || theme === 'seventeen') ? '#000000' : '#ffffff',
                      boxShadow: theme === 'gd'
                        ? '0 4px 15px rgba(255, 235, 59, 0.2)'
                        : theme === 'seventeen'
                          ? '0 4px 15px rgba(247, 202, 201, 0.3)'
                          : '0 4px 15px rgba(255, 64, 129, 0.25)'
                    }}
                  >
                    <span>➕</span> 新增倒數
                  </button>
                )}
              </div>

              <div className="kpop-dashboard-list">
                {countdownEvents
                  .filter((event) => event.userEmail === 'system' || (userEmail && event.userEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()))
                  .map((event) => {
                    const remaining = getCountdownString(event.targetDate);
                    const isSystem = event.userEmail === 'system';

                    const renderCountdownText = () => {
                      if (remaining.startsWith('🎉')) {
                        return (
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isDarkTheme ? 'rgba(255, 255, 255, 0.04)' : 'var(--bg-sec)',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            width: 'fit-content',
                            border: '1px solid var(--border)'
                          }}>
                            {remaining}
                          </div>
                        );
                      }

                      const regex = /(\d+)(天|小時|分|秒)/g;
                      const matches = [...remaining.matchAll(regex)];
                      if (matches.length === 0) {
                        return (
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            color: 'var(--accent)',
                            fontFamily: 'monospace'
                          }}>
                            {remaining}
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                          {matches.map((match, idx) => {
                            const val = match[1];
                            const unit = match[2];
                            const displayVal = (val.length === 1 && unit !== '天') ? `0${val}` : val;
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                <span style={{
                                  background: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  padding: '5px 8px',
                                  fontSize: '18px',
                                  fontWeight: '850',
                                  fontFamily: 'monospace, sans-serif',
                                  color: 'var(--accent)',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                  display: 'inline-block',
                                  minWidth: '28px',
                                  textAlign: 'center',
                                  lineHeight: '1.2'
                                }}>
                                  {displayVal}
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-sub)' }}>{unit}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    };

                    return (
                      <div
                        key={event.id}
                        className="kpop-dashboard-card"
                        style={{
                          background: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.45)',
                          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)'}`,
                          borderRadius: '18px',
                          padding: '18px',
                          position: 'relative',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '800', fontSize: '14.5px', color: 'var(--text-main)' }}>
                            {event.title}
                          </div>
                          {loggedInUser && (event.userEmail === userEmail || isSystem) && (
                            <button
                              onClick={() => handleDeleteCountdown(event.id)}
                              className="delete-btn"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {renderCountdownText()}
                        <div style={{ fontSize: '10.5px', color: 'var(--text-sub)', marginTop: '8px', opacity: 0.8 }}>
                          目標時間: {new Date(event.targetDate).toLocaleString('zh-TW')}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right side: Schedules */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `2px solid ${isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                paddingBottom: '12px'
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <span style={{ fontSize: '18px' }}>📋</span> 打歌與行程表
                </h3>
                {loggedInUser && (
                  <button
                    onClick={() => {
                      setNewScheduleTitle('');
                      setNewScheduleDate('');
                      setNewScheduleType('show');
                      setShowAddScheduleModal(true);
                    }}
                    className="kpop-btn-add"
                    style={{
                      background: theme === 'gd'
                        ? '#ffeb3b'
                        : theme === 'seventeen'
                          ? 'linear-gradient(135deg, #f7cac9, #92a8d1)'
                          : theme === 'anime'
                            ? '#ff7fa9'
                            : 'linear-gradient(135deg, var(--accent), #ff4081)',
                      color: (theme === 'gd' || theme === 'seventeen') ? '#000000' : '#ffffff',
                      boxShadow: theme === 'gd'
                        ? '0 4px 15px rgba(255, 235, 59, 0.2)'
                        : theme === 'seventeen'
                          ? '0 4px 15px rgba(247, 202, 201, 0.3)'
                          : '0 4px 15px rgba(255, 64, 129, 0.25)'
                    }}
                  >
                    <span>➕</span> 新增行程
                  </button>
                )}
              </div>

              <div className="kpop-dashboard-list">
                {(() => {
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  return schedules
                    .filter((sch) => sch.userEmail === 'system' || (userEmail && sch.userEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()))
                    .filter((sch) => sch.date >= todayStr)
                    .map((sch) => {
                      const isSystem = sch.userEmail === 'system';
                      const getBadgeDetails = (type: string) => {
                        switch (type) {
                          case 'comeback': return { text: '💿 回歸', color: 'var(--accent)', bg: 'rgba(255, 64, 129, 0.12)' };
                          case 'concert': return { text: '🎤 演唱會', color: '#ff1744', bg: 'rgba(255, 23, 68, 0.12)' };
                          case 'birthday': return { text: '🎂 生日', color: '#ff80ab', bg: 'rgba(255, 128, 171, 0.12)' };
                          case 'show': return { text: '📺 節目', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.12)' };
                          default: return { text: '⭐ 其他', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
                        }
                      };
                      const badge = getBadgeDetails(sch.type);
                      return (
                        <div
                          key={sch.id}
                          className="kpop-dashboard-card"
                          style={{
                            background: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.45)',
                            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)'}`,
                            borderLeft: `5px solid ${badge.color}`,
                            borderRadius: '16px',
                            padding: '14px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: badge.bg,
                                color: badge.color,
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                whiteSpace: 'nowrap',
                                border: `1px solid color-mix(in srgb, ${badge.color} 20%, transparent)`
                              }}>
                                {badge.text}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 'bold' }}>{sch.date}</span>
                            </div>
                            <div style={{
                              fontSize: '13.5px',
                              fontWeight: '800',
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.2px'
                            }} title={sch.title}>
                              {sch.title}
                            </div>
                          </div>
                          {loggedInUser && (sch.userEmail === userEmail || isSystem) && (
                            <button
                              onClick={() => handleDeleteSchedule(sch.id)}
                              className="delete-btn"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })
                })()}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 📜 雲端歷史日記列表區 */}
      <section style={{ padding: '80px 20px', background: 'transparent' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative' }}>

          <h2 style={{
            fontSize: '26px',
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: '700',
            color: (isDarkTheme || theme === 'anime') ? '#fff' : '#2c3e50',
            textShadow: theme === 'bts'
              ? '0 2px 15px rgba(161, 125, 240, 0.6), 0 1px 4px rgba(161, 125, 240, 0.4)'
              : theme === 'gd'
                ? '0 2px 15px rgba(255, 235, 59, 0.6), 0 1px 4px rgba(255, 235, 59, 0.4)'
                : (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa')
                  ? '0 2px 12px rgba(255,255,255,0.3)'
                  : '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}>
            {theme === 'gd' ? '⚡ GD 獨家不羈文字唱片軌跡'
              : theme === 'bts' ? '💜 BTS 紫色星河時光留聲機'
                : theme === 'seventeen' ? '💎 SEVENTEEN 克拉家族元氣生活圖鑑'
                  : theme === 'anime' ? '🌸 日本動漫 青空與櫻花主角物語日記'
                    : theme === 'ive' ? '🎀 IVE 頂級鑽石大千金生活圖鑑'
                      : theme === 'babymonster' ? '🩸 BABYMONSTER 狂暴爪痕文字熔爐'
                        : theme === 'kpop' ? '🍭 TWICE 萬千星芒璀璨時光編織紀錄'
                          : theme === 'blackpink' ? '🔥 BLACKPINK 統治全域女王編年史'
                            : theme === 'aespa' ? '🪐 aespa 曠野次元超現實記憶載體'
                              : '📜 您的歷史日記列表'}
          </h2>

          <p style={{
            color: (isDarkTheme || theme === 'anime') ? 'rgba(255, 255, 255, 0.8)' : '#666',
            textAlign: 'center',
            fontSize: '14px',
            marginBottom: '35px',
            transition: 'all 0.3s ease'
          }}>
            {theme === 'gd' ? '打破常規的雲端美學矩陣已載入'
              : theme === 'bts' ? '在紫色星海的擁抱下，珍藏防彈與你走過的每一段 Dynamite 青春足跡'
                : theme === 'seventeen' ? 'Say the Name！用清爽的寧靜粉藍，編織克拉與少年們的溫馨日常'
                  : theme === 'anime' ? '在櫻花瓣飄落的青空之下，翻開你作為二次元主角的溫暖冒險繪卷'
                    : theme === 'ive' ? '高奢端莊的雲端紀錄系統，時刻閃耀著鑽石般的璀璨色澤'
                      : theme === 'babymonster' ? '怪物新人的狂暴能量已注入，正在同步遠端靈魂數據'
                        : theme === 'kpop' ? '點亮專屬的 Candy Bong，將我們共同的 Shining Moment 永久封存'
                          : theme === 'blackpink' ? 'In Your Area！以粉黑之名，高調宣示妳的專屬統治紀錄'
                            : theme === 'aespa' ? 'Su-Su-Su-Supernova！跨越平行的 Real World，解碼來自 SYNK 的記憶碎片'
                              : '從雲端資料庫即時拉取的個人紀錄'}
          </p>

          {!loggedInUser ? (
            /* 🔒 訪客提示卡片 */
            <div style={{
              textAlign: 'center',
              padding: '50px 30px',
              background: isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
              borderRadius: '16px',
              border: isDarkTheme ? '2px dashed rgba(255,255,255,0.2)' : '2px dashed rgba(0,0,0,0.1)',
              color: isDarkTheme ? '#ffffff' : '#334155',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease'
            }}>
              <p style={{
                fontSize: '16px',
                marginBottom: '16px',
                fontWeight: '600',
                textShadow: isDarkTheme ? '0 2px 8px rgba(255,255,255,0.2)' : 'none'
              }}>
                目前處於訪客狀態，請先登入帳號來解鎖與查看您的歷史雲端日記！
              </p>

              <button onClick={() => setCurrentView('login')} style={{
                padding: '12px 28px',
                background: 'var(--accent)',
                color: (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000 !important' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '900',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              }}
                ref={(el) => {
                  if (el) el.style.setProperty('color', (theme === 'gd' || theme === 'seventeen' || theme === 'anime') ? '#000000' : '#ffffff', 'important');
                }}>
                立刻前往登入
              </button>
            </div>
          ) : myDiaries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 30px', background: 'var(--bg-color)', borderRadius: '16px', border: '2px dashed var(--border)', color: 'var(--text-sub)' }}>
              <p style={{ fontSize: '16px' }}>歡迎回來！目前雲端上還沒有您的紀錄。點擊上方按鈕留下第一筆回憶吧！</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {myDiaries.map((diary) => (
                <div key={diary.id} style={{ background: 'var(--bg-color)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-sub)' }}>📅 {diary.date}</span>
                    <span
                      title={diary.mood}
                      style={{
                        background: (theme === 'gd' || theme === 'ive' || theme === 'babymonster' || theme === 'bts') ? '#000' : 'var(--bg-sec)',
                        color: theme === 'gd' ? '#ffeb3b' : theme === 'bts' ? '#a17df0' : theme === 'seventeen' ? '#f59a98' : theme === 'anime' ? '#ff7fa9' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--text-main)',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                        border: theme === 'gd' ? '1px solid #ffeb3b' : theme === 'bts' ? '1px solid #a17df0' : theme === 'seventeen' ? '1px solid #f59a98' : theme === 'anime' ? '1px solid #ff7fa9' : theme === 'ive' ? '1px solid #ff4081' : theme === 'babymonster' ? '1px solid #ff1744' : '1px solid var(--border)',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle'
                      }}
                    >{diary.mood}</span>
                  </div>

                  <h3 style={{
                    fontSize: '20px',
                    margin: '0 0 12px 0',
                    fontWeight: '700',
                    color: isDarkTheme ? '#ffffff' : 'var(--text-main)',
                    transition: 'all 0.3s ease'
                  }}>
                    {diary.title} {diary.isSecret ? <span style={{ marginLeft: '8px', fontSize: '14px' }}>🔒</span> : null}
                  </h3>

                  {diary.bgm && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid var(--border)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--accent)',
                      fontWeight: 'bold',
                      marginTop: '4px',
                      marginBottom: '8px'
                    }}>
                      🎵 {diary.bgm}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      {diary.isSecret ? (
                        <p style={{
                          fontSize: '16px',
                          margin: 0,
                          color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-sub)',
                          transition: 'all 0.3s ease'
                        }}>
                          🔒 這是一篇秘密日記，請按「查看」並輸入密碼以檢視內容。
                        </p>
                      ) : (
                        <p style={{
                          fontSize: '16px',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.7',
                          color: isDarkTheme ? '#e2e8f0' : 'var(--text-sub)',
                          transition: 'all 0.3s ease'
                        }}>{diary.content}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => handleViewDiary(diary)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>查看</button>
                      {diary.userEmail === userEmail && (
                        <>
                          <button onClick={() => handleEditDiary(diary)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)', cursor: 'pointer' }}>編輯</button>
                          <button onClick={() => handleDeleteDiary(diary.id)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #ff6b6b', background: 'transparent', color: '#ff6b6b', cursor: 'pointer' }}>刪除</button>
                          {!diary.isSecret && (
                            <button onClick={() => handleTogglePublic(diary.id, !!diary.isPublic)} style={{ padding: '8px 12px', borderRadius: '10px', border: diary.isPublic ? '1px solid #00d084' : '1px solid var(--border)', background: 'transparent', color: diary.isPublic ? '#00d084' : 'var(--text-main)', cursor: 'pointer' }}>{diary.isPublic ? '🌍 已公開' : '🔒 設為公開'}</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {diary.photo && !diary.isSecret && (
                    <img src={diary.photo} alt="Diary Photo" className="diary-photo" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 🔮 頁尾 */}
      <footer>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>

            <div style={{ textAlign: 'left' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '22px' }}>
                Mem<em>oir</em>
              </a>
              <p style={{ fontSize: '13px', color: 'var(--text-sub)', margin: '8px 0 0 0', maxWidth: '300px' }}>
                用音樂與文字，將你每一天的珍貴情感與旋律，安全地封存在雲端。
              </p>
            </div>

          </div>

          <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', color: 'var(--text-sub)', flexWrap: 'wrap', gap: '10px' }}>
            <span>© 2026 Memoir. All rights reserved.</span>
            <span style={{ fontWeight: '600', color: theme === 'gd' ? '#ffeb3b' : theme === 'bts' ? '#a17df0' : theme === 'seventeen' ? '#f59a98' : theme === 'anime' ? '#ff7fa9' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--accent)' }}>
              {theme === 'gd' ? '🌼 G-DRAGON 潮流先鋒終端控制塔頂峰對接' :
                theme === 'bts' ? '💜 BTS 紫色星河天團時光控制塔已啟動' :
                  theme === 'seventeen' ? '💎 SEVENTEEN 克拉應援能量矩陣連線中' :
                    theme === 'anime' ? '🌸 ANIME 櫻花日常二次元終端模組加載完成' :
                      theme === 'ive' ? '🎀 IVE 大千金精緻鑽石矩陣完美連線' :
                        theme === 'babymonster' ? '😈 BABYMONSTER 怪物新人黑馬引擎全開' :
                          '🎵 K-POP 跨世代超級控制台已解鎖'}
            </span>
          </div>
        </div>
      </footer>

      {renderGlobalModals()}

      {/* ➕ 新增倒數 Modal */}
      {showAddCountdownModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>➕ 新增活動倒數</h3>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>活動/回歸標題</label>
              <input
                type="text"
                value={newCountdownTitle}
                onChange={(e) => setNewCountdownTitle(e.target.value)}
                placeholder="例如: AESPA 新專輯發行"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sec)',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>目標日期與時間</label>
              <input
                type="datetime-local"
                value={newCountdownDate}
                onChange={(e) => setNewCountdownDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sec)',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => setShowAddCountdownModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-main)'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveCountdown}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                新增倒數
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ 新增行程 Modal */}
      {showAddScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>➕ 新增追星行程</h3>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>行程名稱/標題</label>
              <input
                type="text"
                value={newScheduleTitle}
                onChange={(e) => setNewScheduleTitle(e.target.value)}
                placeholder="例如: M Countdown 打歌節目"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sec)',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>行程日期</label>
              <input
                type="date"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sec)',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>行程類型</label>
              <select
                value={newScheduleType}
                onChange={(e) => setNewScheduleType(e.target.value as typeof newScheduleType)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sec)',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              >
                <option value="comeback">💿 回歸/新歌發行</option>
                <option value="concert">🎤 演唱會/見面會</option>
                <option value="birthday">🎂 偶像生日</option>
                <option value="show">📺 綜藝/打歌節目</option>
                <option value="other">⭐ 其他活動</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => setShowAddScheduleModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-main)'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveSchedule}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                新增行程
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App;
