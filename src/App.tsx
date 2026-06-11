import { useEffect, useState } from 'react'
import './App.css'

// 💡 引入剛剛連線成功的音樂 App Firebase 設定
import { db } from './firebase' 
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

// 📝 定義日記的資料型態
interface DiaryItem {
  id: string
  title: string
  content: string
  mood: string
  date: string
}

function App() {
  // 完美切換四種畫面：'home' (首頁), 'editor' (寫日記), 'register' (註冊), 'login' (登入)
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'register' | 'login'>('home')

  // 用來儲存使用者輸入的日記內容
  const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryMood, setDiaryMood] = useState('😊 開心')

  // ✨ 新增：儲存從 Firebase 撈出來的歷史日記清單
  const [myDiaries, setMyDiaries] = useState<DiaryItem[]>([])

  // 用來儲存使用者輸入的註冊資料
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')

  // 用來儲存使用者輸入的登入資料
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // 儲存目前登入的使用者姓名與 Email
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null) // ✨ 用來綁定日記的擁有者

  // 🎯 ✨ 新增：從 Firebase 撈取目前登入使用者的所有日記
  const fetchUserDiaries = async (email: string) => {
    try {
      // 尋找 diaries 集合中，userEmail 等於目前登入者 Email 的文件
      const q = query(collection(db, 'diaries'), where('userEmail', '==', email))
      const querySnapshot = await getDocs(q)
      const diariesList: DiaryItem[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        diariesList.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          mood: data.mood,
          date: data.date
        })
      })
      
      // 排序：讓最新寫的日記排在最上面
      diariesList.sort((a, b) => b.date.localeCompare(a.date))
      setMyDiaries(diariesList)
    } catch (error) {
      console.error("撈取日記失敗：", error)
    }
  }

  // 💾 儲存日記的動作：升級為寫入 Firebase
  const handleSaveDiary = async () => {
    if (!diaryTitle.trim() || !diaryContent.trim()) {
      alert('請填寫標題和日記內容喔！')
      return
    }

    // 防呆：沒登入不能寫
    if (!userEmail) {
      alert('請先登入帳號，才能保存日記到雲端喔！')
      setCurrentView('login')
      return
    }

    try {
      // 用 Email 加時間序號當作唯一的文件 ID
      const diaryId = `${userEmail}_${Date.now()}`
      const diaryDocRef = doc(db, 'diaries', diaryId)
      
      const today = new Date()
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

      // 寫入 Firebase
      await setDoc(diaryDocRef, {
        userEmail: userEmail, // 綁定使用者
        title: diaryTitle.trim(),
        content: diaryContent.trim(),
        mood: diaryMood,
        date: dateString,
        createdAt: today.toISOString()
      })

      alert(`儲存成功！日記已同步安全保存至雲端。`)
      
      // 清空輸入框
      setDiaryTitle('')
      setDiaryContent('')
      
      // ✨ 重新拉取一次資料庫，讓首頁即時看到最新日記
      await fetchUserDiaries(userEmail)
      setCurrentView('home')
    } catch (error) {
      console.error("儲存日記失敗：", error)
      alert('儲存日記失敗，請確認後台的 diaries 集合是否已啟用。')
    }
  }

  // 🔐 串接 Firebase：處理註冊送出
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!registerEmail.trim() || !registerPassword.trim() || !registerName.trim()) {
      alert('所有欄位都要填寫喔！')
      return
    }

    try {
      const userDocRef = doc(db, 'app_users', registerEmail.trim())
      
      await setDoc(userDocRef, {
        email: registerEmail.trim(),
        password: registerPassword.trim(),
        name: registerName.trim(),
        createdAt: new Date().toISOString()
      })

      alert(`帳號註冊成功！資料已同步至 music 資料庫。\n歡迎加入：${registerName}`)
      
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterName('')
      setCurrentView('login')

    } catch (error) {
      console.error("Firebase 註冊失敗：", error)
      alert('註冊時發生錯誤，請檢查 Firebase 配置。')
    }
  }

  // 🔑 串接 Firebase：處理登入驗證
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('請輸入電子郵件和密碼喔！')
      return
    }

    try {
      const userDocRef = doc(db, 'app_users', loginEmail.trim())
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        
        if (userData.password === loginPassword.trim()) {
          alert(`登入成功！歡迎回來，${userData.name} 👋`)
          setLoggedInUser(userData.name)
          setUserEmail(loginEmail.trim()) // ✨ 記錄登入者的 Email
          
          // ✨ 關鍵：登入成功後，立刻抓取這個帳號之前的歷史日記
          await fetchUserDiaries(loginEmail.trim())
          
          setLoginEmail('')
          setLoginPassword('')
          setCurrentView('home') 
        } else {
          alert('密碼錯誤喔，請再確認一次！')
        }
      } else {
        alert('找不到這個帳號，要不要先去註冊一個呢？')
      }
    } catch (error) {
      console.error("Firebase 登入失敗：", error)
      alert('登入連線失敗。')
    }
  }

  // 登出功能
  const handleLogout = () => {
    setLoggedInUser(null)
    setUserEmail(null)
    setMyDiaries([]) // ✨ 登出時清空日記清單，避免畫面殘留
    alert('已成功登出帳號！')
  }

  useEffect(() => {
    if (currentView !== 'home') return

    const animatedItems = Array.from(document.querySelectorAll('.fade-up'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        });
      },
      { threshold: 0.12 },
    )

    animatedItems.forEach((element) => observer.observe(element))

    const nav = document.querySelector('nav') as HTMLElement | null
    const handleScroll = () => {
      if (!nav) return
      if (window.scrollY > 40) {
        nav.style.padding = '12px 40px'
        nav.style.boxShadow = '0 2px 20px rgba(26,22,18,0.06)'
      } else {
        nav.style.padding = '18px 40px'
        nav.style.boxShadow = 'none'
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    };
  }, [currentView])

  // ==================== 畫面 1：寫日記的地方 ====================
  if (currentView === 'editor') {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(26,22,18,0.05)', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', color: '#8c7e6e', cursor: 'pointer', fontSize: '15px' }}>
            ← 返回首頁
          </button>
          <div style={{ fontSize: '14px', color: '#8c7e6e' }}>撰寫新日記</div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '8px' }}>今天的心情</label>
          <select value={diaryMood} onChange={(e) => setDiaryMood(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e6dfd5', background: '#faf9f6', fontSize: '16px', color: '#4a3f35' }}>
            <option>😊 開心</option><option>🌿 平靜</option><option>🚀 有動力</option><option>😢 沮喪</option><option>😡 生氣</option><option>😴 疲憊</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '8px' }}>日記標題</label>
          <input type="text" placeholder="給今天一個溫柔的標題..." value={diaryTitle} onChange={(e) => setDiaryTitle(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #e6dfd5', fontSize: '18px', boxSizing: 'border-box', outline: 'none', color: '#4a3f35' }} />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '8px' }}>日記內容</label>
          <textarea rows={12} placeholder="把今天發生的事、想留下來的心情，都寫在這裡吧..." value={diaryContent} onChange={(e) => setDiaryContent(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #e6dfd5', fontSize: '16px', boxSizing: 'border-box', lineHeight: '1.6', resize: 'vertical', outline: 'none', color: '#4a3f35' }} />
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button onClick={() => setCurrentView('home')} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e6dfd5', background: '#fff', color: '#4a3f35', cursor: 'pointer', fontSize: '16px' }}>取消</button>
          <button onClick={handleSaveDiary} style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', background: '#c9933a', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 12px rgba(201,147,58,0.2)' }}>儲存日記</button>
        </div>
      </div>
    )
  }

  // ==================== 畫面 2：註冊帳號的地方 ====================
  if (currentView === 'register') {
    return (
      <div style={{ maxWidth: '420px', margin: '90px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(26,22,18,0.06)', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <h2 style={{ color: '#2a241e', marginBottom: '8px', fontSize: '26px', fontWeight: '700' }}>建立您的音樂帳號</h2>
        <p style={{ color: '#8c7e6e', fontSize: '14px', marginBottom: '32px' }}>開啟同步功能，讓回憶與旋律永不丟失</p>
        
        <form onSubmit={handleRegisterSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '6px' }}>使用者姓名</label>
            <input type="text" placeholder="例如：傑米" value={registerName} onChange={(e) => setRegisterName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e6dfd5', boxSizing: 'border-box', outline: 'none', fontSize: '15px', color: '#4a3f35' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '6px' }}>電子郵件信箱 (Email)</label>
            <input type="email" placeholder="請輸入 Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e6dfd5', boxSizing: 'border-box', outline: 'none', fontSize: '15px', color: '#4a3f35' }} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '6px' }}>設定密碼</label>
            <input type="password" placeholder="請輸入密碼" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e6dfd5', boxSizing: 'border-box', outline: 'none', fontSize: '15px', color: '#4a3f35' }} />
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#c9933a', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(201,147,58,0.15)' }}>
            註冊帳號
          </button>
        </form>

        <button onClick={() => setCurrentView('login')} style={{ background: 'none', border: 'none', color: '#c9933a', cursor: 'pointer', fontSize: '14px', marginRight: '10px' }}>
          已有帳號？前往登入
        </button>
        | 
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', color: '#8c7e6e', cursor: 'pointer', fontSize: '14px', marginLeft: '10px' }}>
          返回首頁
        </button>
      </div>
    )
  }

  // ==================== 畫面 3：會員登入頁面 ====================
  if (currentView === 'login') {
    return (
      <div style={{ maxWidth: '420px', margin: '110px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(26,22,18,0.06)', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <h2 style={{ color: '#2a241e', marginBottom: '8px', fontSize: '26px', fontWeight: '700' }}>歡迎回來</h2>
        <p style={{ color: '#8c7e6e', fontSize: '14px', marginBottom: '32px' }}>請輸入您的帳號密碼進行驗證</p>
        
        <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '6px' }}>電子郵件信箱 (Email)</label>
            <input type="email" placeholder="請輸入您的註冊 Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e6dfd5', boxSizing: 'border-box', outline: 'none', fontSize: '15px', color: '#4a3f35' }} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a3f35', marginBottom: '6px' }}>密碼</label>
            <input type="password" placeholder="請輸入密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e6dfd5', boxSizing: 'border-box', outline: 'none', fontSize: '15px', color: '#4a3f35' }} />
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#4a3f35', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginBottom: '16px' }}>
            登入系統
          </button>
        </form>

        <button onClick={() => setCurrentView('register')} style={{ background: 'none', border: 'none', color: '#c9933a', cursor: 'pointer', fontSize: '14px', marginRight: '10px' }}>
          還沒有帳號？現在註冊
        </button>
        | 
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', color: '#8c7e6e', cursor: 'pointer', fontSize: '14px', marginLeft: '10px' }}>
          返回首頁
        </button>
      </div>
    )
  }

  // ==================== 畫面 4：原本的首頁介紹 + 📜 歷史日記區塊 ====================
  return (
    <>
      {/* NAV */}
      <nav>
        <a className="nav-logo" href="#">Mem<em>oir</em></a>
        <ul className="nav-links">
          <li><a href="#features">功能</a></li>
          <li><a href="#diaries-list">我的日記清單</a></li>
        </ul>
        <div className="nav-cta">
          {loggedInUser ? (
            <>
              <span style={{ fontSize: '14px', color: '#4a3f35', marginRight: '10px' }}>👑 {loggedInUser} 的日記本</span>
              <a href="#" className="btn-ghost" onClick={(e) => { e.preventDefault(); handleLogout(); }}>登出</a>
            </>
          ) : (
            <>
              <a href="#" className="btn-ghost" onClick={(e) => { e.preventDefault(); setCurrentView('login'); }}>登入</a>
              <a href="#" className="btn-fill" onClick={(e) => { e.preventDefault(); setCurrentView('register'); }}>免費開始</a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <svg className="hero-lines" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <line x1="0" y1="120" x2="1440" y2="120" /><line x1="0" y1="240" x2="1440" y2="240" /><line x1="0" y1="360" x2="1440" y2="360" /><line x1="0" y1="480" x2="1440" y2="480" /><line x1="0" y1="600" x2="1440" y2="600" /><line x1="0" y1="720" x2="1440" y2="720" />
        </svg>

        <div className="eyebrow"><div className="eyebrow-dot"></div>新開音樂資料庫連線已就緒</div>

        <h1 className="fade-up visible">把每一天的你，<br /><em>好好留下來</em></h1>
        <p className="hero-sub fade-up visible" style={{ transitionDelay: '0.1s' }}>Memoir 是一本活著的日記。資料已全面對接到你的全新 music 資料庫。</p>

        <div className="hero-actions">
          <a href="#" className="btn-hero btn-hero-primary" onClick={(e) => { e.preventDefault(); setCurrentView('editor'); }}>開始寫日記</a>
          <a href="#features" className="btn-hero btn-hero-secondary">了解更多</a>
        </div>

        <div className="mood-orbit">
          <div className="mood-chip">😊 今天很開心</div><div className="mood-chip">🔒 雲端同步儲存</div><div className="mood-chip">📬 歷史紀錄</div>
        </div>
      </section>

      {/* 📜 ✨✨ 新增：雲端歷史日記展示區塊 ✨✨ */}
      <section id="diaries-list" style={{ background: '#faf9f6', padding: '80px 20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', color: '#2a241e', marginBottom: '8px', textAlign: 'center', fontWeight: '700' }}>
            📜 您的歷史日記列表
          </h2>
          <p style={{ color: '#8c7e6e', textAlign: 'center', fontSize: '14px', marginBottom: '35px' }}>
            從雲端資料庫即時拉取的個人紀錄
          </p>

          {!loggedInUser ? (
            /* 狀況 A：尚未登入 */
            <div style={{ textAlign: 'center', padding: '50px 30px', background: '#fff', borderRadius: '16px', border: '2px dashed #e6dfd5', color: '#8c7e6e' }}>
              <p style={{ fontSize: '16px', margin: '0 0 16px 0' }}>目前處於訪客狀態，請先登入帳號來解鎖與查看您的雲端日記！</p>
              <button onClick={() => setCurrentView('login')} style={{ padding: '10px 24px', background: '#c9933a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(201,147,58,0.2)' }}>
                立刻前往登入
              </button>
            </div>
          ) : myDiaries.length === 0 ? (
            /* 狀況 B：已登入但沒寫過日記 */
            <div style={{ textAlign: 'center', padding: '50px 30px', background: '#fff', borderRadius: '16px', border: '2px dashed #e6dfd5', color: '#8c7e6e' }}>
              <p style={{ fontSize: '16px', margin: '0' }}>歡迎回來！目前雲端上還沒有您的日記紀錄喔。點擊上方「開始寫日記」留下第一筆回憶吧！</p>
            </div>
          ) : (
            /* 狀況 C：正常顯示日記列表 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {myDiaries.map((diary) => (
                <div key={diary.id} style={{ background: '#fff', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(26,22,18,0.03)', border: '1px solid #e6dfd5', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#8c7e6e', fontWeight: '500' }}>📅 {diary.date}</span>
                    <span style={{ background: '#faf9f6', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', border: '1px solid #e6dfd5', fontWeight: 'bold' }}>{diary.mood}</span>
                  </div>
                  <h3 style={{ fontSize: '20px', color: '#4a3f35', margin: '0 0 12px 0', fontWeight: '700' }}>{diary.title}</h3>
                  <p style={{ fontSize: '16px', color: '#6b5e51', margin: '0', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{diary.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-bg" id="features">
        <div className="container">
          <div className="section-eyebrow">完整功能</div>
          <div className="section-title">一個地方，<em>記錄所有面向</em>的自己</div>
          <div className="features-grid fade-up">
            <div className="feat-card"><div className="feat-icon">✍️</div><div className="feat-name">富文本編輯器</div><div className="feat-desc">支援 Markdown 快捷鍵與所見即所得模式。</div><div className="feat-tag">TipTap</div></div>
            <div className="feat-card"><div className="feat-icon">😌</div><div className="feat-name">心情紀錄</div><div className="feat-desc">六種預設心情加上自訂強度，幫你追蹤情緒。</div><div className="feat-tag">情緒追蹤</div></div>
            <div className="feat-card"><div className="feat-icon">🤖</div><div className="feat-name">AI 摘要與情緒分析</div><div className="feat-desc">儲存日記後，AI 自動生成摘要。</div><div className="feat-tag">Gemini API</div></div>
            <div className="feat-card"><div className="feat-icon">📬</div><div className="feat-name">給未來自己的信</div><div className="feat-desc">設定解鎖日期，時間到了才顯示。</div><div className="feat-tag">加密上鎖</div></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <a className="footer-logo" href="#">Mem<em>oir</em></a>
        <span className="footer-copy">© 2026 Memoir. 音樂控制台版本。</span>
      </footer>
    </>
  )
}

export default App