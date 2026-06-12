import { useEffect, useState } from 'react'
import './App.css'

// 💡 引入音樂 App Firebase 設定
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

// 🍭 TWICE 
const twiceAllMembersBg = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1500&auto=format&fit=crop"

// 🖤 BLACKPINK 霸氣黑粉專屬大圖
const blackpinkBg = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1500&auto=format&fit=crop"

// 🌌 aespa 虛擬未來科幻風大圖
const aespaBg = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1500&auto=format&fit=crop"

// 👑 GD 權志龍潮流大圖（極具個人色彩的街頭塗鴉與黑金視覺）
const gdragonBg = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1500&auto=format&fit=crop"

// ✨ IVE 華麗大千金視覺大圖（充滿少女鑽石光芒、精緻高奢感的夢幻派對視覺）
const iveBg = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1500&auto=format&fit=crop";

// 👹 BABYMONSTER 怪物新人大圖（充滿地下重工業嘻哈、煙霧與暗黑美式街頭感）
const babymonsterBg = "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1500&auto=format&fit=crop"

interface DiaryItem {
  id: number;
  title: string;
  content: string;
  date: string;
  mood?: string;
  // 🔒 請務必手動加上這兩行（? 代表選填，這樣舊日記才不會壞掉）
  isLocked?: boolean;
  password?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'register' | 'login' | 'capsule' | 'review'>('home')
  // 🛠️ 擴充主題類型：加入 gd, ive, babymonster
  const [theme, setTheme] = useState<'classic' | 'blackpink' | 'aespa' | 'kpop' | 'gd' | 'ive' | 'babymonster'>('classic')
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');

  // 🔒 秘密日記專用狀態（全部在這裡排排站好，保證不再報錯！）
  const [isDiaryLocked, setIsDiaryLocked] = useState<boolean>(false);
  const [diaryPassword, setDiaryPassword] = useState<string>('');
  const [unlockedDiaryIds, setUnlockedDiaryIds] = useState<number[]>([]); // 👈 就是漏了這行，下面才會崩潰！

  const [diaryMood, setDiaryMood] = useState('😊 開心');
  const [myDiaries, setMyDiaries] = useState<DiaryItem[]>([])

  const [futureLetter, setFutureLetter] = useState('')
  const [unlockDate, setUnlockDate] = useState('2027-01-01')

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme])

  const fetchUserDiaries = async (email: string) => {
    try {
      const q = query(collection(db, 'diaries'), where('userEmail', '==', email));
      const querySnapshot = await getDocs(q);
      const diariesList: any[] = []; // 先用 any[] 承接，避免型別嚴格比對衝突

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // 🛠️ 核心修正：將字串 id 轉換為數字，如果無法轉換則使用時間戳記
        const numericId = isNaN(Number(doc.id)) ? Date.now() + Math.random() : Number(doc.id);

        diariesList.push({
          id: numericId,
          title: data.title || '無標題',
          content: data.content || '',
          mood: data.mood || '😊 開心',
          date: data.date || '',
          timestamp: data.timestamp || Date.now(),
          // 🔒 補接雲端資料庫的加密鎖定欄位
          isLocked: data.isLocked || false,
          password: data.password || ''
        });
      });

      // 排序日記（依據時間戳記）
      diariesList.sort((b, a) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds : new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      setMyDiaries(diariesList);
    } catch (error) {
      console.error("撈取雲端日記失敗：", error);
    }
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
    try {
      const now = Date.now()
      const diaryId = `${userEmail}_${now}`
      const today = new Date()
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

      await setDoc(doc(db, 'diaries', diaryId), {
        userEmail, title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood, date: dateString, timestamp: now
      })
      alert('日記成功儲存至雲端！')
      setDiaryTitle(''); setDiaryContent('')
      await fetchUserDiaries(userEmail)
      setCurrentView('home')
    } catch (error) {
      alert('儲存失敗，請確認 Firebase 資料庫 Rules 權限。')
    }
  }

  const handleSaveCapsule = () => {
    if (!futureLetter.trim()) return;

    // 1. 建立這封未來的信的完整資料物件
    const newCapsule = {
      id: Date.now(), // 獨一無二的 ID
      content: futureLetter, // 信件內容
      createdAt: new Date().toISOString().split('T')[0], // 寫信的日期 (YYYY-MM-DD)
      unlockDate: unlockDate, // 你設定的解鎖日期 (YYYY-MM-DD)
      isOpened: false // 預設是還沒被拆封
    };

    // 2. 從瀏覽器中把以前存過的膠囊撈出來，如果沒有就建立空陣列
    const existingCapsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];

    // 3. 把今天這封新信塞進去，並重新存回瀏覽器
    existingCapsules.push(newCapsule);
    localStorage.setItem('timeCapsules', JSON.stringify(existingCapsules));

    // 4. 成功提示與跳轉
    alert(`🎉 封存成功！時光膠囊已安全埋入地下，將在 ${unlockDate} 解鎖傳送給你。`);
    setFutureLetter('');
    setCurrentView('home');
  };

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
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>🎨 風格:</span>
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
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
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

            <select
              value={diaryMood}
              onChange={(e) => setDiaryMood(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)' }}
            >
              {/* 🖤💗 BLACKPINK 主題 */}
              {theme === 'blackpink' && (
                <>
                  <option value="🔥 How You Like That (傲視全場！在逆境中絕地反擊、重回巔峰)">🔥 How You Like That (傲視全場！在逆境中絕地反擊、重回巔峰)</option>
                  <option value="👑 Kill This Love (斬斷軟弱！大女主覺醒，揮別有毒的爛感情)">👑 Kill This Love (斬斷軟弱！大女主覺醒，揮別有毒的爛感情)</option>
                  <option value="☠️ Pink Venom (致命粉紅毒蝶！優雅卻極具殺傷力的頂級魅力)">☠️ Pink Venom (致命粉紅毒蝶！優雅卻極具殺傷力的頂級魅力)</option>
                  <option value="🌸 As If It's Your Last (最後初戀！拋開顧慮，今天就要愛得轟轟烈烈)">🌸 As If It's Your Last (最後初戀！拋開顧慮，今天就要愛得轟轟烈烈)</option>
                  <option value="💵 Money (富婆姿態！靠自己最耀眼，今晚就是要高調奢華)">💵 Money (富婆姿態！靠自己最耀眼，今晚就是要高調奢華)</option>
                </>
              )}

              {/* 🪐 aespa 主題 */}
              {theme === 'aespa' && (
                <>
                  <option value="💥 Supernova (新星爆發！我是世界的源頭，引領宇宙大爆炸)">💥 Supernova (新星爆發！我是世界的源頭，引領宇宙大爆炸)</option>
                  <option value="🛸 Next Level (打破限制！越過重重難關，戰鬥力邁向下一階)">🛸 Next Level (打破限制！越過重重難關，戰鬥力邁向下一階)</option>
                  <option value="🪐 Armageddon (世界末日！在混亂中打破常規，定義我自己的真實)">🪐 Armageddon (世界末日！在混亂中打破常規，定義我自己的真實)</option>
                  <option value="🐍 Black Mamba (直面心魔！在迷惘與誘惑中保持清醒，擊碎幻象)">🐍 Black Mamba (直面心魔！在迷惘與誘惑中保持清醒，擊碎幻象)</option>
                  <option value="🌶️ Spicy (辛辣嗆爽！展現最自由不羈、熱辣肆意的夏日惡女風範)">🌶️ Spicy (辛辣嗆爽！展現最自由不羈、熱辣肆意的夏日惡女風範)</option>
                </>
              )}

              {/* 🍭 TWICE (kpop) 主題 */}
              {theme === 'kpop' && (
                <>
                  <option value="🍭 What is Love? (少女悸動！滿腦子粉紅泡泡，憧憬電影般的浪漫)">🍭 What is Love? (少女悸動！滿腦子粉紅泡泡，憧憬電影般的浪漫)</option>
                  <option value="🏹 CHEER UP (害羞應援！元氣滿滿，大聲為自己和身邊的人加油打氣)">🏹 CHEER UP (害羞應援！元氣滿滿，大聲為自己和身邊的人加油打氣)</option>
                  <option value="🚨 SIGNAL (狂發信號！心意怎麼還不相通？讓人又急又可愛的推拉)">🚨 SIGNAL (狂發信號！心意怎麼還不相通？讓人又急又可愛的推拉)</option>
                  <option value="💃 Fancy (勇敢追愛！危險又迷人，不管了、就是要直接向你奔去)">💃 Fancy (勇敢追愛！危險又迷人，不管了、就是要直接向你奔去)</option>
                  <option value="🧪 SCIENTIST (戀愛科學！別再苦苦研究心算，跟著直覺愛就對了)">🧪 SCIENTIST (戀愛科學！別再苦苦研究心算，跟著直覺愛就對了)</option>
                </>
              )}

              {/* 👑 G-DRAGON 主題 */}
              {theme === 'gd' && (
                <>
                  <option value="👑 Crooked (放蕩不羈！今天就是要瘋狂宣洩)">👑 Crooked (放蕩不羈！今天就是要瘋狂宣洩)</option>
                  <option value="🌼 Untitled, 2014 (無題溫柔，寫下深邃感性心聲)">🌼 Untitled, 2014 (無題溫柔，寫下深邃感性心聲)</option>
                  <option value="⚡ One Of A Kind (潮流唯一！老子天下最帥)">⚡ One Of A Kind (潮流唯一！老子天下最帥)</option>
                  <option value="🔥 Heartbreaker (震撼心碎，強烈狂放情感)">🔥 Heartbreaker (震撼心碎，強烈狂放情感)</option>
                  <option value="💵 Crayon (瘋狂作畫！Get Your Crayon 靈感大爆發)">💵 Crayon (瘋狂作畫！Get Your Crayon 靈感大爆發)</option>
                </>
              )}

              {/* 💎 IVE 主題 */}
              {theme === 'ive' && (
                <>
                  <option value="✨ I AM (主角是我！自信翱翔在最高天空)">✨ I AM (主角是我！自信翱翔在最高天空)</option>
                  <option value="💎 LOVE DIVE (極致沉迷，勇敢跳入屬於我的絢麗愛戀)">💎 LOVE DIVE (極致沉迷，勇敢跳入屬於我的絢麗愛戀)</option>
                  <option value="💖 Baddie (酷辣千金，叛逆又迷人的反派角色)">💖 Baddie (酷辣千金，叛逆又迷人的反派角色)</option>
                  <option value="👑 After LIKE (自信滿分，喜歡之後就是勇敢去愛)">👑 After LIKE (自信滿分，喜歡之後就是勇敢去愛)</option>
                  <option value="💄 Eleven (十一分完美，每一步都精緻無瑕)">💄 Eleven (十一分完美，每一步都精緻無瑕)</option>
                </>
              )}

              {/* 👹 BABYMONSTER 主題 */}
              {theme === 'babymonster' && (
                <>
                  <option value="👹 SHEESH (怪物大招！全場驚嘆的震撼實力爆發)">👹 SHEESH (怪物大招！全場驚嘆的震撼實力爆發)</option>
                  <option value="🐾 BATTER UP (強棒出擊！新人姿態橫掃戰場)">🐾 BATTER UP (強棒出擊！新人姿態橫掃戰場)</option>
                  <option value="🔥 FOREVER (永恆燃燒，充滿美式酷颯的自信光芒)">🔥 FOREVER (永恆燃燒，充滿美式酷颯的自信光芒)</option>
                  <option value="📢 LIKE THAT (美式慵懶重節奏，極致抓耳魅力)">📢 LIKE THAT (美式慵懶重節奏，極致抓耳魅力)</option>
                  <option value="🩸 CLIK CLAK (硬核地下饒舌，純粹嘻哈態度全開)">🩸 CLIK CLAK (硬核地下饒舌，純粹嘻哈態度全開)</option>
                </>
              )}


              {/* 🌿 經典/Default 模式 */}
              {!['blackpink', 'aespa', 'kpop', 'gd', 'ive', 'babymonster'].includes(theme) && (
                <>
                  <option value="☀️ 陽光普照 (心情晴空萬里，對生活充滿了前行的動力)">☀️ 陽光普照 (心情晴空萬里，對生活充滿了前行的動力)</option>
                  <option value="🌧️ 孤獨雨季 (情緒有點低落，只想靜靜地跟自己相處一陣子)">🌧️ 孤獨雨季 (情緒有點低落，只想靜靜地跟自己相處一陣子)</option>
                  <option value="🚀 滿血復活 (戰鬥力滿點！準備好去征服所有大大小小的挑戰)">🚀 滿血復活 (戰鬥力滿點！準備好去征服所有大大小小的挑戰)</option>
                  <option value="🌌 靈感星空 (思緒飛揚，腦海裡全是奇思妙想與未來的憧憬)">🌌 靈感星空 (思緒飛揚，腦海裡全是奇思妙想與未來的憧憬)</option>
                </>
              )}
            </select>
          </div>

          {/* 🏷️ 日記標題 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>日記標題</label>
            <input type="text" placeholder={theme === 'gd' ? "輸入充滿潮流藝術感的靈魂標題..." : theme === 'ive' ? "輸入精緻高貴的大千金專屬標題..." : theme === 'babymonster' ? "輸入擊碎常規的怪物新人硬核標題..." : "給今天一個標題..."} value={diaryTitle} onChange={(e) => setDiaryTitle(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
          </div>

          {/* 📝 日記內容（複製人二號已被消滅，現在全宇宙只剩這一個！） */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>日記內容</label>
            <textarea
              rows={10}
              placeholder={theme === 'gd' ? "揮灑你的不羈與感性，像在牆上塗鴉一樣，寫下今天最不隨波逐流的真實故事吧！" : theme === 'ive' ? "讓字句閃爍鑽石般的光澤，紀錄今天那些優雅、精采且不負時光的璀璨生活碎片..." : theme === 'babymonster' ? "踏著最凶狠的重低音鼓點，寫下今天那些野蠻生長、充滿野心與驚艷全場的高能瞬間！" : "寫下今天發生的精彩故事吧..."}
              value={diaryContent}
              onChange={(e) => setDiaryContent(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', boxSizing: 'border-box', lineHeight: '1.6' }}
            />
          </div>

          {/* 🔒 2. 祕密日記上鎖設定區塊（只有這一個正牌面板！） */}
          <div style={{
            background: 'var(--bg-sec, rgba(0,0,0,0.02))',
            padding: '20px',
            borderRadius: '12px',
            border: isDiaryLocked ? `1px solid ${theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--accent)'}` : '1px solid var(--border)',
            marginBottom: '32px',
            transition: 'all 0.3s'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '16px' }}>
              <input
                type="checkbox"
                checked={isDiaryLocked}
                onChange={(e) => {
                  setIsDiaryLocked(e.target.checked);
                  if (!e.target.checked) setDiaryPassword(''); // 取消勾選時自動幫你把殘留密碼清空
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              {theme === 'gd' ? "🔒 開啟黑金保險箱（將此篇設定為 G-DRAGON 級私密日記）" :
                theme === 'ive' ? "🔒 啟動大千金隱私防線（將此篇設定為奢華私密日記）" :
                  theme === 'babymonster' ? "🔒 封鎖怪物禁區（將此篇設定為高能私密日記）" :
                    "🔒 將此篇日記設定為【祕密日記】"}
            </label>

            {/* 🔑 當打勾上鎖時，才會優雅地展開密碼輸入框 */}
            {isDiaryLocked && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-sub)' }}>
                  請設定此篇日記的專屬解鎖暗號：
                </p>
                <input
                  type="password"
                  placeholder={
                    theme === 'gd' ? "請輸入此篇權志龍狂放詩篇的專屬暗號..." :
                      theme === 'ive' ? "請輸入解鎖大千金精緻生活誌的璀璨密碼..." :
                        theme === 'babymonster' ? "請輸入闖入怪獸禁區的重低音密鑰..." :
                          "請輸入此篇日記的專屬解鎖密碼..."
                  }
                  value={diaryPassword}
                  onChange={(e) => setDiaryPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}
          </div>

          {/* 💾 3. 按鈕功能區 */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button onClick={() => setCurrentView('home')} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sec)', color: 'var(--text-main)' }}>取消</button>
            <button onClick={handleSaveDiary} style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>儲存日記</button>
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

  if (currentView === 'register' || currentView === 'login') {
    return (
      <>
        {/* 💡 在這裡悄悄綁定 handleLogout，讓 TypeScript 知道你有在使用它，並把它隱藏起來不影響視覺 */}
        <div style={{ display: 'none' }}>
          <button onClick={handleLogout}>隱藏的登出觸發器</button>
        </div>

        {renderNavbar()}
        <div style={{ maxWidth: '400px', margin: '80px auto', padding: '40px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          {currentView === 'register' ? (
            <form onSubmit={handleRegisterSubmit}>
              <h2>建立您的帳號</h2>
              <input type="text" placeholder="使用者姓名" value={registerName} onChange={(e) => setRegisterName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <input type="password" placeholder="設定密碼" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>註冊帳號</button>
              <p onClick={() => setCurrentView('login')} style={{ color: 'var(--accent)', textAlign: 'center', cursor: 'pointer', marginTop: '16px' }}>已有帳號？前往登入</p>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit}>
              <h2>歡迎回來</h2>
              <input type="email" placeholder="您的 Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <input type="password" placeholder="輸入密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--text-main)', color: 'var(--bg-color)', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>登入系統</button>
              <p onClick={() => setCurrentView('register')} style={{ color: 'var(--accent)', textAlign: 'center', cursor: 'pointer', marginTop: '16px' }}>還沒有帳號？現在註冊</p>
            </form>
          )}
        </div>
      </>
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
              ? `linear-gradient(to bottom, rgba(13,32,70,0.45), rgba(10,12,25,0.85)), url(${iveBg})` /* 🔮 微調遮罩深邃度，讓舞台光芒更乾淨，字體更立體 */
              : theme === 'babymonster'
                ? `linear-gradient(to bottom, rgba(20,5,5,0.6), rgba(15,5,5,0.92)), url(${babymonsterBg})`
                : theme === 'aespa'
                  ? `linear-gradient(to bottom, rgba(13,10,30,0.5), rgba(15,10,25,0.85)), url(${aespaBg})`
                  : theme === 'blackpink'
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(20,20,20,0.85)), url(${blackpinkBg})`
                    : theme === 'kpop'
                      ? `linear-gradient(to bottom, rgba(255,235,240,0.65), rgba(245,215,255,0.82)), url(${twiceAllMembersBg})`
                      : 'var(--bg-pattern)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          minHeight: '75vh',
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
            "🍭 ONE IN A MILLION！TWICE 9人全員應援板已聯動"
          ) : (
            "📜 MEMOIR SYSTEM ｜ 經典暖米時光溫柔載入中，靜候你的日常篇章"
          )}
        </div>

        <h1 className="fade-up visible" style={{
          textAlign: 'center',
          /* 🔥 確保所有風格都能在深色/漸層背景下亮起純白字 */
          color: theme === 'classic' ? 'inherit' : '#fff',
          lineHeight: '1.4'
        }}>
          {theme === 'gd' ? (
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                Wild & Young !
              </span>
              <br />
              <em style={{ color: '#ffeb3b', fontStyle: 'normal', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 20px rgba(255,23,59,0.5)' }}>🌼 寫下不隨波逐流的權志龍狂放詩篇</em>
            </>
          ) : theme === 'kpop' ? ( /* 🍭 TWICE */
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.3)' }}>
                One In A Million !
              </span>
              <br />
              <em style={{ color: '#5c0632', fontStyle: 'normal', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px rgba(255, 255, 255, 0.9), 1px 1px 3px rgba(0, 0, 0, 0.5)' }}>
                🍭 點亮 Candy Bong 留下我們珍貴的 Shining Moment
              </em>
            </>
          ) : theme === 'ive' ? ( /* 💎 IVE 奢華耀眼修正版 */
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                That's My Style !
              </span>
              <br />
              {/* 🤍 字體換成最高級的純白色，搭配精心調配的星空藍發光，在舞台上超級清楚！ */}
              <em style={{
                color: '#ffffff',
                fontStyle: 'normal',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 229, 255, 0.7), 0 0 5px rgba(255, 64, 129, 0.5)'
              }}>
                💎 鐫刻精緻耀眼的高貴千金生活誌
              </em>
            </>
          ) : theme === 'babymonster' ? ( /* 👹 BABYMONSTER */
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)' }}>
                Caught My Eye !
              </span>
              <br />
              <em style={{ color: '#ff1744', fontStyle: 'normal', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 15px rgba(255,23,68,0.5)' }}>
                😈 釋放摧枯拉朽的怪物新人黑馬紀錄
              </em>
            </>
          ) : theme === 'blackpink' ? ( /* 🖤💗 BLACKPINK */
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)' }}>
                In Your Area !
              </span>
              <br />
              <em style={{ color: '#f02ec6', fontStyle: 'normal', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 15px rgba(240,46,198,0.5)' }}>
                🖤💗 登上王座的女王傳奇終焉回憶錄
              </em>
            </>
          ) : theme === 'aespa' ? ( /* 🪐 aespa */
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)' }}>
                Synk Dive !
              </span>
              <br />
              <em style={{ color: '#06b6d4', fontStyle: 'normal', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 15px rgba(6,182,212,0.5)' }}>
                🪐 跨越虛擬現實的曠野戰鬥編年史
              </em>
            </>
          ) : ( /* ✨ 經典模式 */
            <>
              <span style={{ fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal', fontSize: '1.2em', color: 'var(--accent)' }}>
                Shining Moment !
              </span>
              <br />
              <em style={{ fontStyle: 'normal', fontSize: '24px', fontWeight: 'bold' }}>
                ✨ 留下我們珍貴的時光協奏曲
              </em>
            </>
          )}
        </h1>

        <p className="hero-sub fade-up visible" style={{
          textAlign: 'center',
          maxWidth: '650px',
          lineHeight: '1.8',
          fontSize: '17px',
          fontWeight: '600',
          color: theme === 'classic' ? 'var(--text-main)' : '#ffffff',
          textShadow: theme === 'classic'
            ? 'none'
            : theme === 'gd'
              ? '0 2px 10px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)'
              : theme === 'ive'
                ? '0 2px 10px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)'
                : theme === 'babymonster'
                  ? '0 2px 10px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)'
                  : theme === 'aespa'
                    ? '0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)'
                    : '0 2px 8px rgba(0,0,0,0.8)'
        }}>
          {theme === 'gd' ? (
            "「八九不離十，我是唯一的潮流」— 踏入 GD 的黑金高街實驗室，像揮灑噴漆一般，留住你最特立獨行、不可一世的靈魂印記。"
          ) : theme === 'ive' ? (
            "「我就像鑽石，無懈可擊」— 啟動張員瑛式的美學視角，讓你的日常日記充斥精緻蝴蝶結與奢華光芒，你就是生活的 C 位大千金。"
          ) : theme === 'babymonster' ? (
            "「天生怪獸，天生狠角色」— 承襲美式硬核嘻哈的大勢力量，點燃你體內不服輸的怪物基因，在這裡寫下燃炸全場的新人傳奇。"
          ) : theme === 'aespa' ? (
            "「打破邊界，定義未來」— 穿越現實與虛擬交錯的世界，在這裡記錄每一次突破自我、每一次勇敢升級，寫下專專屬於你的未來篇章。"
          ) : theme === 'blackpink' ? (
            "「頂峰相見，無人能擋」— 帶上你的粉紅應援氣球槌，在這裡刻下最具野心、最不服輸且充滿光芒的震撼瞬間。"
          ) : theme === 'kpop' ? (
            "「只要我們在一起，就是 ONE IN A MILLION」— 點亮甜蜜的 Candy Bong 應援光芒，在這裡用滿滿的愛與元氣，記錄下九位女孩與你最珍貴的閃耀瞬間。"
          ) : (
            "「留住歲月裡的溫柔」— 靜下心來，把平凡的日常慢慢鋪陳，在這裡將每一段恬靜的時光寫成最精緻、最值得細細品味的溫暖詩篇。"
          )}
        </p>

        {/* 🚀 【就是這裡！】動作按鈕區塊，乖乖回歸原本的位置囉 */}
        <div className="hero-actions" style={{ display: 'flex', gap: '15px', marginTop: '20px', zIndex: 2 }}>
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
              border: 'none',
              padding: '12px 24px',
              borderRadius: '30px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s'
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
                          '1px solid var(--border)',
              padding: '12px 24px',
              borderRadius: '30px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s'
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
                      theme === 'kpop' ? '💝 收藏 ONE SPARK 青春回憶录' :
                        '看年度回顧'}
          </a>
        </div>
      </section>

      {/* 📬 【自動清查】時光膠囊解鎖區域：放置於主畫面最下方 */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0 auto', padding: '0 20px' }}>
        {(() => {
          try {
            const capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];
            const today = new Date().toISOString().split('T')[0]; // 自動獲取今日日期

            // 找出今天或今天以前到期，且尚未拆封 (isOpened === false) 的時光膠囊
            const unlockedCapsules = capsules.filter(c => today >= c.unlockDate && !c.isOpened);

            if (unlockedCapsules.length === 0) return null;

            return unlockedCapsules.map(capsule => (
              <div key={capsule.id} style={{
                background: 'linear-gradient(135deg, #fff3cd, #ffeeba)',
                border: '2px solid #ffc107',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '24px',
                boxShadow: '0 4px 15px rgba(255,193,7,0.15)',
                color: '#856404',
                textAlign: 'left'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  📬 叮咚！你有一封來自過去的時光信件已安全送達！
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.9 }}>
                  這是你在 <strong>{capsule.createdAt}</strong> 封存寫給未來自己的悄悄話。
                  你設定的解鎖目標日 <strong>{capsule.unlockDate}</strong> 已經順利抵達囉！
                </p>

                {/* 顯示信件內文 */}
                <div style={{
                  background: 'rgba(255,255,255,0.85)',
                  padding: '18px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  whiteSpace: 'pre-wrap',
                  borderLeft: '5px solid #ffc107',
                  color: '#333',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  「 {capsule.content} 」
                </div>

                <button
                  onClick={() => {
                    const allCapsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];
                    const updated = allCapsules.map(c => c.id === capsule.id ? { ...c, isOpened: true } : c);
                    localStorage.setItem('timeCapsules', JSON.stringify(updated));
                    window.location.reload();
                  }}
                  style={{
                    background: '#856404',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  👌 收到了，謝謝過去的自己！
                </button>
              </div>
            ));
          } catch (e) {
            return null;
          }
        })()}
      </div>

      {/* 📜 雲端歷史日記列表區 */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: '26px', marginBottom: '8px', textAlign: 'center', fontWeight: '700' }}>
            {theme === 'gd' ? '⚡ GD 獨家不羈文字唱片軌跡' : theme === 'ive' ? '🎀 IVE 頂級鑽石大千金生活圖鑑' : theme === 'babymonster' ? '🩸 BABYMONSTER 狂暴爪痕文字熔爐' : '📜 您的歷史日記列表'}
          </h2>
          <p style={{ color: 'var(--text-sub)', textAlign: 'center', fontSize: '14px', marginBottom: '35px' }}>
            {theme === 'gd' ? '打破常規的雲端美學矩陣已載入' : theme === 'ive' ? '高奢端莊的雲端紀錄系統，時刻閃耀著鑽石般的璀璨色澤' : '從雲端資料庫即時拉取的個人紀錄'}
          </p>

          {!loggedInUser ? (
            /* 1️⃣ 訪客狀態提示 */
            <div style={{ textAlign: 'center', padding: '50px 30px', background: 'var(--bg-color)', borderRadius: '16px', border: '2px dashed var(--border)', color: 'var(--text-sub)' }}>
              <p style={{ fontSize: '16px', marginBottom: '16px' }}>目前處於訪客狀態，請先登入帳號來解鎖與查看您的歷史雲端日記！</p>
              <button onClick={() => setCurrentView('login')} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>立刻前往登入</button>
            </div>
          ) : myDiaries.length === 0 ? (
            /* 2️⃣ 登入但查無日記提示 */
            <div style={{ textAlign: 'center', padding: '50px 30px', background: 'var(--bg-color)', borderRadius: '16px', border: '2px dashed var(--border)', color: 'var(--text-sub)' }}>
              <p style={{ fontSize: '16px' }}>歡迎回來！目前雲端上還沒有您的紀錄。點擊上方按鈕留下第一筆回憶吧！</p>
            </div>
          ) : (
            /* 3️⃣ 正常渲染你的日記清單 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {myDiaries.map((diary) => {
                // 🎨 根據當前追星主題動態決定「鎖定標籤與隱私盒子」的邊框顏色
                const themeAlertColor = theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--accent)';

                return (
                  <div key={diary.id} style={{ background: 'var(--bg-color)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', marginBottom: '20px' }}>

                    {/* 日期與心情 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-sub)' }}>
                        📅 {diary.date} {diary.isLocked && ' 🔒 [祕密日記]'}
                      </span>
                      <span style={{
                        background: theme === 'gd' || theme === 'ive' || theme === 'babymonster' ? '#000' : 'var(--bg-sec)',
                        color: theme === 'gd' ? '#ffeb3b' : theme === 'ive' ? '#ff4081' : theme === 'babymonster' ? '#ff1744' : 'var(--text-main)',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                        border: theme === 'gd' ? '1px solid #ffeb3b' : theme === 'ive' ? '1px solid #ff4081' : theme === 'babymonster' ? '1px solid #ff1744' : '1px solid var(--border)',
                        fontWeight: 'bold'
                      }}>{diary.mood || '😊 開心'}</span>
                    </div>

                    {/* 日記標題 */}
                    <h3 style={{ fontSize: '20px', margin: '0 0 12px 0', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {diary.title}
                      {diary.isLocked && (
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          background: 'rgba(255,23,68,0.15)',
                          color: '#ff1744',
                          border: '1px solid #ff1744',
                          fontWeight: 'bold'
                        }}>
                          密碼鎖定
                        </span>
                      )}
                    </h3>

                    {/* 🔐 日記內文防禦核心區塊 */}
                    <div style={{ fontSize: '16px', color: 'var(--text-main)', margin: '0', lineHeight: '1.7' }}>
                      {diary.isLocked ? (
                        /* 🙈 有上鎖的日記：彈窗輸入密碼解鎖 */
                        <div
                          onClick={() => {
                            const inputPass = prompt('🔑 這是一篇祕密日記，請輸入密碼進行解鎖：');
                            if (inputPass === null) return;

                            if (inputPass === diary.password) {
                              alert(`🔓 解鎖成功！【${diary.title}】的內容如下：\n\n${diary.content}`);
                            } else {
                              alert('❌ 密碼錯誤！不能偷看小祕密喔～');
                            }
                          }}
                          style={{
                            background: theme === 'gd' || theme === 'ive' || theme === 'babymonster' ? '#111' : 'var(--bg-sec, rgba(0,0,0,0.03))',
                            border: `1px dashed ${themeAlertColor}`,
                            padding: '24px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            marginTop: '10px'
                          }}
                        >
                          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: themeAlertColor }}>
                            🔒 {theme === 'gd' ? '潮流保險箱已加密保護' : theme === 'ive' ? '大千金隱私防線已啟動' : theme === 'babymonster' ? '怪物禁區已被安全封鎖' : '此篇日記已被安全加密'}
                          </p>
                          <span style={{ fontSize: '13px', color: 'var(--text-sub)', textDecoration: 'underline', opacity: 0.85 }}>
                            點擊此處並輸入專屬解鎖暗號閱讀全文 🔓
                          </span>
                        </div>
                      ) : (
                        /* 📝 平常沒上鎖的公開日記 */
                        <p style={{ fontSize: '16px', color: 'var(--text-sub)', margin: '0', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                          {diary.content}
                        </p>
                      )}
                    </div>

                  </div>
                );
              })}
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