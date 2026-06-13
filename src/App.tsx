import { useEffect, useState } from 'react'
import './App.css'

// 💡 引入音樂 App Firebase 設定
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'

// 🍭 TWICE 
const twiceAllMembersBg = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1500&auto=format&fit=crop"

// 🖤 BLACKPINK 霸氣黑粉專屬大圖
const blackpinkBg = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1500&auto=format&fit=crop"

// 🌌 aespa 虛擬未來科幻風大圖
const aespaBg = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1500&auto=format&fit=crop"

// 👑 GD 權志龍潮流大圖（極具個人色彩的街頭塗鴉與黑金視覺）
const gdragonBg = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1500&auto=format&fit=crop"

// ✨ IVE 華麗大千金視覺大圖（充滿少女鑽石光芒、精緻高奢感的夢幻派對視覺）
const iveBg = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1500&auto=format&fit=crop";

// 👹 BABYMONSTER 怪物新人大圖（充滿地下重工業嘻哈、煙霧與暗黑美式街頭感）
const babymonsterBg = "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1500&auto=format&fit=crop"

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
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'register' | 'login' | 'capsule' | 'review' | 'publicWall'>('home')
  // 🛠️ 擴充主題類型：加入 gd, ive, babymonster
  const [theme, setTheme] = useState<'classic' | 'blackpink' | 'aespa' | 'kpop' | 'gd' | 'ive' | 'babymonster'>('classic')
  const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryMood, setDiaryMood] = useState('😊 開心')
  const [myDiaries, setMyDiaries] = useState<DiaryItem[]>([])
  const [isSecret, setIsSecret] = useState(false)
  const [diaryPassword, setDiaryPassword] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [futureLetter, setFutureLetter] = useState('')
  const [unlockDate, setUnlockDate] = useState('2027-01-01')

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [publicDiaries, setPublicDiaries] = useState<DiaryItem[]>([])
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);

    const bodyStyle = document.body.style;
    if (theme === 'gd') {
      bodyStyle.backgroundImage = `linear-gradient(to bottom, rgba(15,15,15,0.95), rgba(18,14,11,0.92)), url(${gdragonBg})`;
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
      const q = query(collection(db, 'diaries'), where('userEmail', '==', email))
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
          isPublic: data.isPublic || false
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
          isPublic: true
        })
      })
      publicList.sort((b, a) => a.timestamp - b.timestamp)
      setPublicDiaries(publicList)
    } catch (error) {
      console.error(error)
    }
  }

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
    try {
      const now = Date.now()
      const diaryId = editingId || `${userEmail}_${now}`
      const today = new Date()
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

      if (isSecret && isPublic) {
        alert('日記不能同時設定為秘密和公開，請選擇一種模式。')
        return
      }
      const payload: any = {
        userEmail,
        author: loggedInUser,
        title: diaryTitle.trim(),
        content: diaryContent.trim(),
        mood: diaryMood,
        date: dateString,
        timestamp: now,
        isSecret: isSecret || false,
        isPublic: isPublic || false
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
      await fetchUserDiaries(userEmail)
      setCurrentView('home')
    } catch (error) {
      alert('儲存失敗，請確認 Firebase 資料庫 Rules 權限。')
    }
  }

  const handleDeleteDiary = async (id: string) => {
    if (!confirm('確定要刪除這篇日記嗎？此動作無法回復。')) return
    try {
      await deleteDoc(doc(db, 'diaries', id))
      if (userEmail) await fetchUserDiaries(userEmail)
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
    setCurrentView('editor')
  }

  const handleTogglePublic = async (id: string, currentPublicStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'diaries', id), { isPublic: !currentPublicStatus })
      if (userEmail) await fetchUserDiaries(userEmail)
      alert(!currentPublicStatus ? '已設為公開日記，所有人都能看到！' : '已取消公開，恢復為私人日記。')
    } catch (err) {
      console.error(err)
      alert('操作失敗')
    }
  }

  const handleViewDiary = (d: DiaryItem) => {
    if (d.isSecret) {
      const pw = prompt('此為秘密日記，請輸入密碼以查看內容')
      if (!pw) return
      if (pw === d.password) {
        alert(`標題: ${d.title}\n\n${d.content}`)
      } else {
        alert('密碼錯誤')
      }
    } else {
      alert(`標題: ${d.title}\n\n${d.content}`)
    }
  }

  const handleSaveCapsule = () => {
    if (!futureLetter.trim()) return
    alert(`封存成功！時光膠囊將在 ${unlockDate} 解鎖。`)
    setFutureLetter('')
    setCurrentView('home')
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerEmail.trim() || !registerPassword.trim() || !registerName.trim()) return
    try {
      await setDoc(doc(db, 'app_users', registerEmail.trim()), {
        email: registerEmail.trim(), password: registerPassword.trim(), name: registerName.trim()
      })
      alert('註冊成功！')
      setCurrentView('login')
    } catch (error) {
      alert('註冊失敗')
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const docSnap = await getDoc(doc(db, 'app_users', loginEmail.trim()))
      if (docSnap.exists() && docSnap.data().password === loginPassword.trim()) {
        alert(`歡迎回來！`)
        setLoggedInUser(docSnap.data().name)
        setUserEmail(loginEmail.trim())
        await fetchUserDiaries(loginEmail.trim())
        setCurrentView('home')
      } else {
        alert('密碼錯誤或帳號不存在')
      }
    } catch (error) {
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

  const renderNavbar = () => {
    return (
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
          {theme === 'gd' ? '🌼 G-DRAGON // ONE OF A KIND' : theme === 'kpop' ? '🍭 TWICE // ONE IN A MILLION' : theme === 'ive' ? '💎 IVE ✨ SHOW WHAT I HAVE' : theme === 'babymonster' ? '👹 BABYMONSTER // BATTER UP' : theme === 'aespa' ? '🪐 æ-Memoir // LIVE MY LIFE' : theme === 'blackpink' ? '🖤 BLACKPINK IN YOUR AREA' : 'Memoir'}
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

          {/* 💻 開發者連結 */}
          <li style={{ whiteSpace: 'nowrap' }}>
            <a
              href="https://5b2g0018.github.io/my/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'var(--accent)',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              💻 開發者
            </a>
          </li>

          {/* 🎨 風格切換 */}
          <li style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}></span>
            <select value={theme} onChange={(e) => setTheme(e.target.value as any)} style={{ padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '13px' }}>
              <option value="classic">🍂 經典暖米</option>
              <option value="blackpink">🖤 BLACKPINK 霸氣黑粉</option>
              <option value="aespa">🪐 aespa 虛擬未來</option>
              <option value="kpop">🍭 TWICE 全員應援</option>
              <option value="gd">🌼 GD 權志龍・潮流至上</option>
              <option value="ive">💎 IVE・大千金視覺</option>
              <option value="babymonster">👹 BABYMONSTER・怪物新人</option>
            </select>
          </li>

          {/* 🔐 修正後的登入狀態判斷區（直接渲染變數本身，完美解除紅線） */}
          {loggedInUser ? (
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>
                👤 {loggedInUser}
              </span>
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
    );
  };

  const handleLogout = () => {
    setLoggedInUser(null); setUserEmail(null); setMyDiaries([]); setCurrentView('home')
  }

  if (currentView === 'editor') {
    return (
      <>
        {renderNavbar()}
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '40px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '16px', position: 'relative' }}>
          {renderThemeDecorations()}
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', marginBottom: '20px' }}>← 返回首頁</button>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              {theme === 'gd' ? '🎵 注入權志龍音樂靈魂！挑選代表你今日特立獨行態度的 GD 神曲' :
                theme === 'ive' ? '🎵 啟動耀眼高貴濾鏡！選擇契合今日大千金心情的 IVE 頂奢名曲' :
                  theme === 'babymonster' ? '🎵 猛獸出籠！選擇釋放你今日怪物實力的 BABYMONSTER 重磅黑馬歌' :
                    theme === 'blackpink' ? '🎵 生人勿近女王降臨！釋放你今日最颯、最霸氣的 BLACKPINK 狂放黑粉魂' :
                      theme === 'aespa' ? '🎵 虛擬現實同步解析！召喚你的 æ，開啟今日 aespa 曠野戰鬥模式' :
                        theme === 'kpop' ? '🎵 活力甜度大爆表！注入 TWICE 專屬滿滿多巴胺，點亮你的元氣少女心' :
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
              ) : theme === 'kpop' ? ( /* 這裡代表 TWICE */
                <>
                  <option>🍭 What is Love? (少女悸動！滿腦子粉紅泡泡，憧憬電影般的浪漫)</option>
                  <option>🏹 CHEER UP (害羞應援！元氣滿滿，大聲為自己和身邊的人加油打氣)</option>
                  <option>🚨 SIGNAL (狂發信號！心意怎麼還不相通？讓人又急又可愛的推拉)</option>
                  <option>💃 Fancy (勇敢追愛！危險又迷人，不管了、就是要直接向你奔去)</option>
                  <option>🧪 SCIENTIST (戀愛科學！別再苦苦研究心算，跟著直覺愛就對了)</option>
                </>
              ) : ( /* 這裡代表 經典/Default 模式 */
                <>
                  <option>☀️ 陽光普照 (心情晴空萬里，對生活充滿了前行的動力)</option>
                  <option>🌿 歲月靜好 (像喝了一杯熱茶，內心無比平靜而知足)</option>
                  <option>🌧️ 孤獨雨季 (情緒有點低落，只想靜靜地跟自己相處一陣子)</option>
                  <option>🚀 滿血復活 (戰鬥力滿點！準備好去征服所有大大小小的挑戰)</option>
                  <option>🌌 靈感星空 (思緒飛揚，腦海裡全是奇思妙想與未來的憧憬)</option>
                </>
              )}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            {/* 🎯 1. 日記標題 Label 點亮 */}
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)'
            }}>
              日記標題
            </label>
            {/* 🎯 2. 標題輸入框：底色微調、輸入文字與 Placeholder 智慧上色 */}
            <input 
              type="text" 
              placeholder={theme === 'gd' ? "輸入充滿潮流藝術感的靈魂標題..." : theme === 'ive' ? "輸入精緻高貴的大千金專屬標題..." : theme === 'babymonster' ? "輸入擊碎常規的怪物新人硬核標題..." : "給今天一個標題..."} 
              value={diaryTitle} 
              onChange={(e) => setDiaryTitle(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                background: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)', 
                color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)', 
                boxSizing: 'border-box' 
              }} 
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            {/* 🎯 3. 日記內容 Label 點亮 */}
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)'
            }}>
              日記內容
            </label>
            {/* 🎯 4. 內容輸入框：同步防禦 */}
            <textarea 
              rows={10} 
              placeholder={theme === 'gd' ? "揮灑你的不羈與感性，像在牆上塗鴉一樣，寫下今天最不隨波逐流的真實故事吧！" : theme === 'ive' ? "讓字句閃爍鑽石般的光澤，紀錄今天那些優雅、精采且不負時光的璀璨生活碎片..." : theme === 'babymonster' ? "踏著最凶狠的重低音鼓點，寫下今天那些野蠻生長、充滿野心與驚艷全場的高能瞬間！" : "寫下今天發生的精彩故事吧..."} 
              value={diaryContent} 
              onChange={(e) => setDiaryContent(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                background: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)', 
                color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)', 
                boxSizing: 'border-box', 
                lineHeight: '1.6' 
              }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* 🎯 5. 設為秘密日記勾選文字點亮 */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '14px',
                fontWeight: '600',
                color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)'
              }}>
                <input type="checkbox" checked={isSecret} onChange={(e) => {
                  const checked = e.target.checked
                  setIsSecret(checked)
                  if (checked) {
                    setIsPublic(false)
                  }
                }} /> 設為秘密日記
              </label>

              {/* 🎯 6. 秘密日記密碼輸入框防禦 */}
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
                    background: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? 'rgba(255,255,255,0.15)' : 'var(--bg-color)', 
                    color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)'
                  }} 
                />
              )}

              {/* 🎯 7. 設為公開日記勾選文字點亮 */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '14px',
                fontWeight: '600',
                color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#ffffff' : 'var(--text-main)'
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
              <button onClick={() => { setCurrentView('home'); setEditingId(null); setIsSecret(false); setDiaryPassword(''); setIsPublic(false); setDiaryTitle(''); setDiaryContent('') }} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)' }}>取消</button>
              <button onClick={handleSaveDiary} style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{editingId ? '更新日記' : '儲存日記'}</button>
            </div>
          </div>
        </div>
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
    const isDark = ['blackpink', 'aespa', 'gd', 'babymonster'].includes(theme);

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

        </div>
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
    const isDark = ['blackpink', 'aespa', 'gd', 'babymonster'].includes(theme);

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
          </div>

        </div>
      </>
    );
  }

  if (currentView === 'publicWall') {
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
                  background: theme === 'blackpink' ? 'rgba(0,0,0,0.55)' : theme === 'aespa' ? 'rgba(8,8,20,0.68)' : theme === 'gd' ? 'rgba(8,8,8,0.7)' : theme === 'ive' ? 'rgba(255,250,255,0.82)' : theme === 'babymonster' ? 'rgba(10,10,10,0.72)' : theme === 'kpop' ? 'rgba(255,245,250,0.92)' : 'var(--bg-sec)',
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
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '8px' }}>✍️ {diary.author || '匿名使用者'}</div>
                      
                      {/* 🎯 1. 標題智慧色彩防禦：四大暗色主題強行亮白字！ */}
                      <h3 style={{ 
                        fontSize: '18px', 
                        margin: '0 0 8px 0', 
                        fontWeight: '700',
                        /* 🎨 核心修正：如果是 dark 底主題（含 GD），字體變純白；其餘淺色主題用預設深色字 */
                        color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') 
                          ? '#ffffff' 
                          : 'var(--text-main)',
                        textShadow: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd')
                          ? '0 1px 4px rgba(0,0,0,0.5)'
                          : 'none',
                        transition: 'color 0.3s ease'
                      }}>{diary.title}</h3>
                      
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '12px' }}>📅 {diary.date}</div>
                    </div>
                    <span style={{
                      background: theme === 'gd' || theme === 'ive' || theme === 'babymonster' ? '#000' : 'var(--bg-color)',
                      color: theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--accent)',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                      border: theme === 'gd' ? '1px solid #ffeb3b' : theme === 'ive' ? '1px solid #ff4081' : theme === 'babymonster' ? '1px solid #ff1744' : 'none',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>{diary.mood}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{diary.content}</p>
                  
                  <div style={{ marginTop: '12px' }}>
                    {/* 🎯 2. 「閱讀完整日記」按鈕防禦：在 GD 主題下強制變黑字！ */}
                    <button 
                      onClick={() => handleViewDiary(diary)} 
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        background: 'var(--accent)', 
                        /* 🎨 雙重防禦：gd 變黑字，其餘主題維持白字 */
                        color: theme === 'gd' ? '#000000 !important' : '#ffffff', 
                        cursor: 'pointer', 
                        fontWeight: '900', // 加粗增加可讀性
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                      /* 💡 注入底層保險，確保 GD 黃色按鈕的文字絕對是黑色的 */
                      ref={(el) => {
                        if (el) el.style.setProperty('color', theme === 'gd' ? '#000000' : '#ffffff', 'important');
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
      </>
    );
  }

  if (currentView === 'register' || currentView === 'login') {
  return (
    /* 🎯 終極全螢幕背景外盒：直接當作最外層，把所有人包進去！徹底吞噬 BABYMONSTER 下方的白底！ */
    <div style={{
      minHeight: '100vh',
      width: '100%',
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
              ? '#f4f1ea' 
              : theme === 'ive' 
                ? '#f0f4f8' 
                : theme === 'kpop' 
                  ? '#f9f6f0' 
                  : 'var(--global-bg)',
      transition: 'background 0.3s ease'
    }}>
      
      {/* 💡 在這裡悄悄綁定 handleLogout，隱藏起來不影響視覺 */}
      <div style={{ display: 'none' }}>
        <button onClick={handleLogout}>隱藏的登出觸發器</button>
      </div>

      {renderNavbar()}

      {/* 📦 登入/註冊卡片置中容器（加上 padding 讓卡片上下有舒適的懸浮留白） */}
      <div style={{ padding: '80px 20px' }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto', // 卡片水平置中
          padding: '40px',
          background: theme === 'kpop' ? 'linear-gradient(180deg, rgba(255, 246, 250, 0.98), rgba(255, 224, 236, 0.98))' : theme === 'blackpink' ? 'rgba(12, 5, 15, 0.96)' : theme === 'aespa' ? 'rgba(8, 14, 32, 0.96)' : theme === 'gd' ? 'rgba(16, 14, 12, 0.96)' : theme === 'ive' ? 'rgba(247, 249, 255, 0.98)' : theme === 'babymonster' ? 'rgba(18, 7, 12, 0.96)' : 'var(--bg-color)',
          border: theme === 'kpop' ? '1px solid rgba(255, 64, 129, 0.2)' : '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: theme === 'kpop' ? '0 24px 80px rgba(255, 64, 129, 0.12)' : '0 24px 60px rgba(0,0,0,0.06)'
        }}>
          {currentView === 'register' ? (
            <form onSubmit={handleRegisterSubmit}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '24px' }}>建立您的帳號</h2>
              <input type="text" placeholder="使用者姓名" value={registerName} onChange={(e) => setRegisterName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
              <input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
              <input type="password" placeholder="設定密碼" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
              <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>註冊帳號</button>
              <p onClick={() => setCurrentView('login')} style={{ color: 'var(--accent)', textAlign: 'center', cursor: 'pointer', marginTop: '16px' }}>已有帳號？前往登入</p>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '24px' }}>歡迎回來</h2>
              <input type="email" placeholder="您的 Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
              <input type="password" placeholder="輸入密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--border)', background: theme === 'blackpink' || theme === 'aespa' || theme === 'gd' || theme === 'babymonster' ? 'rgba(255,255,255,0.08)' : 'var(--bg-color)', color: 'var(--text-main)' }} />
              
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
  )
}

  return (
    <>
      {renderNavbar()}

      {/* 🚀 HERO 主頁區塊 */}
      <section
        className="hero"
        style={{
          position: 'relative',
          // 🛠️ 判斷多主題：增加 GD、IVE、BABYMONSTER 的專屬背景渲染
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
                      ? `linear-gradient(180deg, rgba(255, 247, 251, 0.92) 0%, rgba(255, 233, 242, 0.92) 50%, rgba(255, 213, 232, 0.96) 100%), url(${twiceAllMembersBg})`
                      : 'var(--bg-pattern)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          minHeight: theme === 'gd' ? '100vh' : '75vh',
          backgroundAttachment: theme === 'gd' ? 'fixed' : 'scroll',
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
          background: theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? 'linear-gradient(90deg, #ff80ab, #00e5ff)' : theme === 'babymonster' ? '#ff1744' : theme === 'aespa' ? 'linear-gradient(90deg, #a855f7, #06b6d4)' : theme === 'blackpink' ? '#ff007f' : 'rgba(0,0,0,0.05)',
          color: theme === 'gd' ? '#000' : theme === 'ive' || theme === 'babymonster' || theme === 'aespa' || theme === 'blackpink' ? '#fff' : 'var(--text-main)',
          fontWeight: 'bold'
        }}>
          <div className="eyebrow-dot" style={{ backgroundColor: theme === 'gd' ? '#000' : '#fff' }}></div>
          {theme === 'gd' ? (
            "🌼 COUP D'ETAT！G-DRAGON 潮流藝術脈絡同步中"
          ) : theme === 'ive' ? (
            "✨ WHAT'S AFTER LIKE? IVE 閃耀大千金秀台已就位"
          ) : theme === 'babymonster' ? (
            "👹 ATTENTION！BABYMONSTER 怪物新人重磅音浪突襲"
          ) : theme === 'aespa' ? (
            "🪐 Welcome to KWANGYA！aespa 虛擬同步網絡已對接"
          ) : theme === 'blackpink' ? (
            "🖤 BLACKPINK IN YOUR AREA！BLINK 烈焰重低音模組已啟動"
          ) : theme === 'kpop' ? (
            /* 🍭 這裡專門分給 TWICE 專用，再也不會跟經典風搶位置了！ */
            "🍭 ONE IN A MILLION！TWICE 9人全員應援板已聯動"
          ) : (
            /* 🍂 這是專屬於你「經典暖米」背景的文青台詞 */
            "📜 MEMOIR SYSTEM ｜ 經典暖米時光溫柔載入中，靜候你的日常篇章"
          )}
        </div>

        <h1 className="fade-up visible" style={{
          textAlign: 'center',
          /* 🔥 確保所有風格都能在深色/漸層背景下亮起純白字 */
          color: theme === 'classic' ? 'inherit' : '#fff',
          /* ✨ 全局中文字體優化 */
          fontFamily: '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif',
          letterSpacing: '1px'
        }}>
          {theme === 'gd' ? (
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900' }}>Wild & Young！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#ffeb3b', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 20px rgba(255,235,59,0.5)' }}>🌼 寫下不隨波逐流的權志龍狂放詩篇</em>
            </>
          ) : theme === 'kpop' ? (
            /* 🍭 TWICE */
            <>
              <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: '900', textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.3)' }}>ONE IN A MILLION！</span>
              <br />
              <em style={{ fontSize: '1.3rem', color: '#5c0632', fontStyle: 'italic', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 255, 255, 0.9), 1px 1px 3px rgba(0, 0, 0, 0.5)' }}>
                🍭 點亮 Candy Bong 留下我們珍貴的 Shining Moment
              </em>
            </>
          ) : theme === 'ive' ? (
            /* 💎 IVE */
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
            /* 🔥 BLACKPINK：大字級 4.2rem 藝術英文字 + 1.3rem 質感斜體中文字 */
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
            /* ✨ 預設 Classic 主題 */
            <>
              寫下你每日的心得吧!
              <br />
              <em style={{ fontSize: '1.3rem', fontStyle: 'italic' }}>✨ 留下我們珍貴的 Shining Moment</em>
            </>
          )}
        </h1>
        {/* 🚀 尋找程式碼中的這一段並替換 style */}
        <p className="hero-sub fade-up visible" style={{
          textAlign: 'center',
          maxWidth: '650px',
          lineHeight: '1.8',
          fontSize: '17px', // 微調放大字體
          /* 🔥 核心關鍵：根據不同風格給予最明顯的顏色、加粗與文字陰影 */
          fontWeight: '600',
          color: theme === 'classic' ? 'var(--text-main)' : '#ffffff',
          textShadow: theme === 'classic'
            ? 'none'
            : theme === 'gd'
              ? '0 2px 10px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)'
              : theme === 'ive'
                ? '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)'
                : theme === 'babymonster'
                  ? '0 2px 10px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)'
                  : theme === 'aespa'
                    ? '0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)'
                    : '0 2px 8px rgba(0,0,0,0.8)' // blackpink & kpop 預設深色陰影
        }}
        >
          {theme === 'gd' ? (
            "「八九不離十，我是唯一的潮流」— 踏入 GD 的黑金高街實驗室，像揮灑噴漆一般，留住你最特立獨行、不可一世的靈魂印記。"
          ) : theme === 'ive' ? (
            "「我就像鑽石，無懈可擊」— 啟動張員瑛式的美學視角，讓你的日常日記充斥精緻蝴蝶結與奢華光芒，你就是生活的 C 位大千金。"
          ) : theme === 'babymonster' ? (
            "「天生怪獸，天生狠角色」— 承襲美式硬核嘻哈的大勢力量，點燃你體內不服輸的怪物基因，在這裡寫下燃炸全場的新人傳奇。"
          ) : theme === 'aespa' ? (
            "「打破邊界，定義未來」— 穿越現實與虛擬交錯的世界，在這裡記錄每一次突破自我、每一次勇敢升級，寫下專屬於你的未來篇章。"
          ) : theme === 'blackpink' ? (
            "「頂峰相見，無人能擋」— 帶上你的粉紅應援氣球槌，在這裡刻下最具野心、最不服輸且充滿光芒的震撼瞬間。"
          ) : theme === 'kpop' ? (
            /* 🍭 這是 TWICE 風格下的副標題文字 */
            "「只要我們在一起，就是 ONE IN A MILLION」— 點亮甜蜜的 Candy Bong 應援光芒，在這裡用滿滿的愛與元氣，記錄下九位女孩與你最珍貴的閃耀瞬間。"
          ) : (
            /* 🍂 這是最重要補上的「經典暖米」預設文字，完美避開 TWICE 跑棚！ */
            "「留住歲月裡的溫柔」— 靜下心來，把平凡的日常慢慢鋪陳，在這裡將每一段恬靜的時光寫成最精緻、最值得細細品味的溫暖詩篇。"
          )}
        </p>

        <div className="hero-actions">
          {/* 主要按鈕：開始寫日記 */}
          <a href="#" className="btn-hero btn-hero-primary"
            style={{
              background:
                theme === 'gd' ? '#ffeb3b' :
                  theme === 'ive' ? '#ff4081' :
                    theme === 'babymonster' ? '#ff1744' :
                      theme === 'aespa' ? 'linear-gradient(135deg, #a855f7, #06b6d4)' :
                        theme === 'blackpink' ? '#ff007f' :
                          'var(--accent)',
              color: theme === 'gd' ? '#000' : '#fff',
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
              theme === 'ive' ? '👑 優雅登台 千金寫日記' :
                theme === 'babymonster' ? '🩸 猛獸暴走 怪物寫日記' :
                  theme === 'aespa' ? '🚀 穿越 KWANGYA 未來寫日記' :
                    theme === 'blackpink' ? '🖤💗 女王降臨 Born Pink寫日記' :
                      theme === 'kpop' ? '🍭 心動滿分 青春寫日記' :
                        '開始寫日記'}
          </a>

          {/* 次要按鈕：看年度回顧 */}
          <a href="#" className="btn-hero btn-hero-secondary"
            style={{
              background:
                theme === 'gd' || theme === 'ive' || theme === 'babymonster' || theme === 'aespa' || theme === 'blackpink'
                  ? '#000'
                  : 'var(--bg-sec)',
              color:
                theme === 'gd' ? '#ffeb3b' :
                  theme === 'ive' ? '#ff4081' :
                    theme === 'babymonster' ? '#ff1744' :
                      theme === 'aespa' ? '#00ffff' :
                        theme === 'blackpink' ? '#ff007f' :
                          'var(--text-main)',
              border:
                theme === 'gd' ? '1px solid #ffeb3b' :
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
              theme === 'ive' ? '🎀 開啟 I AM 耀眼璀璨回顧' :
                theme === 'babymonster' ? '📢 觀看 SHEESH 怪物進化軌跡' :
                  theme === 'aespa' ? '🌌 解鎖 Supernova 星際成長紀錄' :
                    theme === 'blackpink' ? '✨ 翻閱 Born Pink 女王傳奇篇章' :
                      theme === 'kpop' ? '💝 收藏 ONE SPARK 青春回憶錄' :

                        '看年度回顧'}
          </a>
        </div>
      </section>

     {/* 📜 雲端歷史日記列表區 */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative' }}>
          
          {/* ✨ 1. 大標題優化：GD、TWICE、IVE 等淺色底一律用質感深藍灰字 #2c3e50 */}
          <h2 style={{ 
            fontSize: '26px', 
            marginBottom: '8px', 
            textAlign: 'center', 
            fontWeight: '700',
            /* 🎨 核心修正：加入 'gd'，讓四大深色背景主題一律強行亮白字！ */
            color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') ? '#fff' : '#2c3e50',
            /* ✨ 專屬光暈防禦：如果是 gd 主題，就綻放強烈叛逆的黃色霓虹光暈！其餘深色用白光 */
            textShadow: theme === 'gd'
              ? '0 2px 15px rgba(255, 235, 59, 0.6), 0 1px 4px rgba(255, 235, 59, 0.4)'
              : (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa') 
                ? '0 2px 12px rgba(255,255,255,0.3)' 
                : '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}>
            {theme === 'gd' ? '⚡ GD 獨家不羈文字唱片軌跡' 
              : theme === 'ive' ? '🎀 IVE 頂級鑽石大千金生活圖鑑' 
              : theme === 'babymonster' ? '🩸 BABYMONSTER 狂暴爪痕文字熔爐' 
              : theme === 'kpop' ? '🍭 TWICE 萬千星芒璀璨時光編織紀錄' 
              : theme === 'blackpink' ? '🔥 BLACKPINK 統治全域女王編年史' 
              : theme === 'aespa' ? '🪐 aespa 曠野次元超現實記憶載體' 
              : '📜 您的歷史日記列表'}
          </h2>

          {/* ✨ 2. 副標題優化：GD 也維持清晰的深灰色字 */}
          <p style={{ 
            color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa') ? 'rgba(255, 255, 255, 0.8)' : '#666', 
            textAlign: 'center', 
            fontSize: '14px', 
            marginBottom: '35px',
            transition: 'all 0.3s ease'
          }}>
            {theme === 'gd' ? '打破常規的雲端美學矩陣已載入' 
             : theme === 'ive' ? '高奢端莊的雲端紀錄系統，時刻閃耀著鑽石般的璀璨色澤' 
             : theme === 'babymonster' ? '怪物新人的狂暴能量已注入，正在同步遠端靈魂數據'
             : theme === 'kpop' ? '點亮專屬的 Candy Bong，將我們共同的 Shining Moment 永久封存' 
             : theme === 'blackpink' ? 'In Your Area！以粉黑之名，高調宣示妳的專屬統治紀錄' 
             : theme === 'aespa' ? 'Su-Su-Supernova！跨越平行的 Real World，解碼來自 SYNK 的記憶碎片' 
             : '從雲端資料庫即時拉取的個人紀錄'}
          </p>

          {!loggedInUser ? (
            /* 🔒 3. 訪客提示卡片 */
            <div style={{ 
              textAlign: 'center', 
              padding: '50px 30px', 
              background: (theme === 'blackpink' || theme === 'aespa' || theme === 'babymonster') 
                ? 'rgba(0, 0, 0, 0.4)' 
                : 'rgba(255, 255, 255, 0.6)', 
              borderRadius: '16px', 
              border: (theme === 'blackpink' || theme === 'aespa' || theme === 'babymonster')
                ? '2px dashed rgba(255,255,255,0.2)'
                : '2px dashed rgba(0,0,0,0.1)', 
              color: (theme === 'blackpink' || theme === 'aespa' || theme === 'babymonster') 
                ? '#ffffff' 
                : '#334155',
              backdropFilter: 'blur(8px)', 
              transition: 'all 0.3s ease' 
            }}>
              <p style={{ 
                fontSize: '16px', 
                marginBottom: '16px', 
                fontWeight: '600',
                textShadow: (theme === 'blackpink' || theme === 'aespa' || theme === 'babymonster')
                  ? '0 2px 8px rgba(255,255,255,0.2)'
                  : 'none'
              }}>
                目前處於訪客狀態，請先登入帳號來解鎖與查看您的歷史雲端日記！
              </p>
              
             {/* 🎯 強制權重防禦：硬把字體壓成黑色！ */}
              <button onClick={() => setCurrentView('login')} style={{ 
                padding: '12px 28px', // 稍微加大一點更好點擊
                background: 'var(--accent)', 
                /* 🎨 使用 css 終極遮罩技巧，如果 theme === 'gd'，強制給予 !important 黑色 */
                color: theme === 'gd' ? '#000000 !important' : '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontSize: '16px', // 字體放大到 16px
                fontWeight: '900', // 爆粗體
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              }}
              /* 💡 雙重保險：萬一行內 style 的 !important 沒反應，我們用 JS 直接在元素渲染時硬塞顏色 */
              ref={(el) => {
                if (el) el.style.setProperty('color', theme === 'gd' ? '#000000' : '#ffffff', 'important');
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
                    <span style={{
                      background: theme === 'gd' || theme === 'ive' || theme === 'babymonster' ? '#000' : 'var(--bg-sec)',
                      color: theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--text-main)',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                      border: theme === 'gd' ? '1px solid #ffeb3b' : theme === 'ive' ? '1px solid #ff4081' : theme === 'babymonster' ? '1px solid #ff1744' : '1px solid var(--border)',
                      fontWeight: 'bold'
                    }}>{diary.mood}</span>
                  </div>
                 {/* 🎯 1. 日記標題色彩防禦：點亮 twice 🔒 和 煩 的地方！ */}
                  <h3 style={{ 
                    fontSize: '20px', 
                    margin: '0 0 12px 0', 
                    fontWeight: '700',
                    /* 🎨 四大深色主題強制變白字，其餘主題維持原色 */
                    color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') 
                      ? '#ffffff' 
                      : 'var(--text-main)',
                    transition: 'all 0.3s ease'
                  }}>
                    {diary.title} {diary.isSecret ? <span style={{marginLeft: '8px', fontSize: '14px'}}>🔒</span> : null}
                  </h3>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      {diary.isSecret ? (
                        /* 🎯 2. 秘密日記提示文字防禦：黑底時變成清晰的淡灰色，淺底維持原樣 */
                        <p style={{ 
                          fontSize: '16px', 
                          margin: 0,
                          color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') 
                            ? 'rgba(255, 255, 255, 0.7)' 
                            : 'var(--text-sub)',
                          transition: 'all 0.3s ease'
                        }}>
                          🔒 這是一篇秘密日記，請按「查看」並輸入密碼以檢視內容。
                        </p>
                      ) : (
                        /* 🎯 3. 一般日記內文防禦：黑底時文字也要變亮白，不然內文會看不清！ */
                        <p style={{ 
                          fontSize: '16px', 
                          margin: 0, 
                          whiteSpace: 'pre-wrap', 
                          lineHeight: '1.7',
                          color: (theme === 'blackpink' || theme === 'babymonster' || theme === 'aespa' || theme === 'gd') 
                            ? '#e2e8f0' // 高級的暖白灰色 
                            : 'var(--text-sub)',
                          transition: 'all 0.3s ease'
                        }}>{diary.content}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => handleViewDiary(diary)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>查看</button>
                      {diary.userEmail === userEmail && (
                        <>
                          <button onClick={() => handleEditDiary(diary)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-sec)', cursor: 'pointer' }}>編輯</button>
                          <button onClick={() => handleDeleteDiary(diary.id)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #ff6b6b', background: 'transparent', color: '#ff6b6b', cursor: 'pointer' }}>刪除</button>
                          <button onClick={() => handleTogglePublic(diary.id, !!diary.isPublic)} style={{ padding: '8px 12px', borderRadius: '10px', border: diary.isPublic ? '1px solid #00d084' : '1px solid var(--border)', background: 'transparent', color: diary.isPublic ? '#00d084' : 'var(--text-main)', cursor: 'pointer' }}>{diary.isPublic ? '🌍 已公開' : '🔒 設為公開'}</button>
                        </>
                      )}
                    </div>
                  </div>
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
            <span style={{ fontWeight: '600', color: theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--accent)' }}>
              {theme === 'gd' ? '🌼 G-DRAGON 潮流先鋒終端控制塔頂峰對接' : theme === 'ive' ? '🎀 IVE 大千金精緻鑽石矩陣完美連線' : theme === 'babymonster' ? '😈 BABYMONSTER 怪物新人黑馬引擎全開' : '🎵 K-POP 跨世代超級控制台已解鎖'}
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App