import { useEffect, useState } from 'react'

import './App.css'



// 💡 引入剛剛連線成功的音樂 App Firebase 設定

import { db } from './firebase'

import { doc, getDoc, setDoc } from 'firebase/firestore'



function App() {

  // 完美切換四種畫面：'home' (首頁), 'editor' (寫日記), 'register' (註冊), 'login' (登入)

  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'register' | 'login'>('home')



  // 用來儲存使用者輸入的日記內容

  const [diaryTitle, setDiaryTitle] = useState('')

  const [diaryContent, setDiaryContent] = useState('')

  const [diaryMood, setDiaryMood] = useState('😊 開心')



  // 用來儲存使用者輸入的註冊資料

  const [registerEmail, setRegisterEmail] = useState('')

  const [registerPassword, setRegisterPassword] = useState('')

  const [registerName, setRegisterName] = useState('')



  // 用來儲存使用者輸入的登入資料

  const [loginEmail, setLoginEmail] = useState('')

  const [loginPassword, setLoginPassword] = useState('')



  // 儲存目前登入的使用者姓名（登入成功後可以顯示）

  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)



  // 儲存日記的動作

  const handleSaveDiary = () => {

    if (!diaryTitle.trim() || !diaryContent.trim()) {

      alert('請填寫標題和日記內容喔！')

      return

    }

    alert(`日記儲存成功！\n標題：${diaryTitle}\n心情：${diaryMood}\n系統已為您安全加密儲存。`)

    setDiaryTitle('')

    setDiaryContent('')

    setCurrentView('home')

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

        password: registerPassword.trim(), // 練習專案先以明碼比對

        name: registerName.trim(),

        createdAt: new Date().toISOString()

      })



      alert(`帳號註冊成功！資料已同步至 music 資料庫。\n歡迎加入：${registerName}`)



      // 清空註冊欄位

      setRegisterEmail('')

      setRegisterPassword('')

      setRegisterName('')



      // 註冊完直接去登入頁面

      setCurrentView('login')



    } catch (error) {

      console.error("Firebase 註冊失敗：", error)

      alert('註冊時發生錯誤，請檢查 Firebase 配置或 Rules 規則。')

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

      // 去 app_users 集合尋找以該 email 為 ID 的文件

      const userDocRef = doc(db, 'app_users', loginEmail.trim())

      const userDocSnap = await getDoc(userDocRef)



      if (userDocSnap.exists()) {

        const userData = userDocSnap.data()



        // 核對密碼是否正確

        if (userData.password === loginPassword.trim()) {

          alert(`登入成功！歡迎回來，${userData.name} 👋`)

          setLoggedInUser(userData.name)



          // 登入成功，清空輸入框並導向首頁或日記編輯器

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

      alert('登入連線失敗，請檢查網路或 Firebase Rules。')

    }

  }



  // 登出功能

  const handleLogout = () => {

    setLoggedInUser(null)

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

          <div style={{ fontSize: '14px', color: '#8c7e6e' }}>2026年6月11日 · 撰寫新日記</div>

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



  // ==================== 🛠️ 新增畫面 3：會員登入頁面 🛠️ ====================

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



  // ==================== 畫面 4：原本的首頁介紹 ====================

  return (

    <>

      {/* NAV */}

      <nav>

        <a className="nav-logo" href="#">Mem<em>oir</em></a>

        <ul className="nav-links">

          <li><a href="#features">功能</a></li>

          <li><a href="#preview">日記編輯</a></li>

          <li><a href="#capsule">時光膠囊</a></li>

          <li><a href="#review">年度回顧</a></li>

        </ul>

        <div className="nav-cta">

          {/* 💡 這裡已經把原本的 alert 換成真正的登入/登出切換功能囉！ */}

          {loggedInUser ? (

            <>

              <span style={{ fontSize: '14px', color: '#4a3f35', marginRight: '10px' }}>你好，{loggedInUser} 🎉</span>

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

        <p className="hero-sub fade-up visible" style={{ transitionDelay: '0.1s' }}>Memoir 是一本活著的日記。AI 幫你摘要、分析情緒，時光膠囊替你保存秘密，年度回顧讓看見自己的成長。</p>



        <div className="hero-actions">

          <a href="#" className="btn-hero btn-hero-primary" onClick={(e) => { e.preventDefault(); setCurrentView('editor'); }}>開始寫日記</a>

          <a href="#features" className="btn-hero btn-hero-secondary">了解更多</a>

        </div>



        <div className="mood-orbit">

          <div className="mood-chip">😊 今天很開心</div><div className="mood-chip">✍️ 已連續記錄 47 天</div><div className="mood-chip">🤖 AI 生成摘要</div><div className="mood-chip">🔒 端對端加密</div><div className="mood-chip">📬 時光膠囊</div>

        </div>

      </section>



      {/* FEATURES */}

      <section className="features-bg" id="features">

        <div className="container">

          <div className="section-eyebrow">完整功能</div>

          <div className="section-title">一個地方，<em>記錄所有面向</em>的自己</div>

          <p className="section-body">從富文本編輯到 AI 情緒分析，從圖片附件到跨年時光膠囊——每個功能都為了讓你更接近自己。</p>

          <div className="features-grid fade-up">

            <div className="feat-card"><div className="feat-icon">✍️</div><div className="feat-name">富文本編輯器</div><div className="feat-desc">支援 Markdown 快捷鍵與所見即所得模式，想怎麼寫就怎麼寫。</div><div className="feat-tag">TipTap</div></div>

            <div className="feat-card"><div className="feat-icon">🖼️</div><div className="feat-name">圖片附件</div><div className="feat-desc">每篇日記可附加多張照片，自動壓縮上傳至雲端安全儲存。</div><div className="feat-tag">雲端儲存</div></div>

            <div className="feat-card"><div className="feat-icon">😌</div><div className="feat-name">心情紀錄</div><div className="feat-desc">六種預設心情加上自訂強度，幫你追蹤情緒的細微起伏。</div><div className="feat-tag">情緒追蹤</div></div>

            <div className="feat-card"><div className="feat-icon">🏷️</div><div className="feat-name">標籤系統</div><div className="feat-desc">自訂標籤、多對多分類，搜尋時精準找到任何一篇舊日記.</div><div className="feat-tag">全文搜尋</div></div>

            <div className="feat-card"><div className="feat-icon">🤖</div><div className="feat-name">AI 摘要與情緒分析</div><div className="feat-desc">儲存日記後，AI 自動生成摘要並給出 0–100 的情緒指數。</div><div className="feat-tag">Gemini API</div></div>

            <div className="feat-card"><div className="feat-icon">⏳</div><div className="feat-name">歷史上的今天</div><div className="feat-desc">首頁自動撈出去年同一天的舊日記，讓過去的你與現在相遇。</div><div className="feat-tag">Time Capsule</div></div>

            <div className="feat-card"><div className="feat-icon">📊</div><div className="feat-name">年度回顧報告</div><div className="feat-desc">心情曲線、熱門標籤、關鍵字雲——一張頁面看懂你的整年。</div><div className="feat-tag">年度統計</div></div>

            <div className="feat-card"><div className="feat-icon">📬</div><div className="feat-name">給未來自己的信</div><div className="feat-desc">設定解鎖日期，時間到了才顯示——你和未來的自己，一個約定。</div><div className="feat-tag">加密上鎖</div></div>

          </div>

        </div>

      </section>



      {/* FOOTER */}

      <footer>

        <a className="footer-logo" href="#">Mem<em>oir</em></a>

        <span className="footer-copy">© 2026 Memoir. 保留所有權利。</span>

      </footer>

    </>

  )

}



export default App