// TACN Connect — Firebase starter app
// 1) Create a Firebase project, enable Email/Password Authentication,
//    create Firestore and Storage, then paste your web config below.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy,
  limit, onSnapshot, serverTimestamp, runTransaction, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};
const $ = id => document.getElementById(id);
const notice = (msg, good=false) => { $("notice").textContent=msg; $("notice").className="status"+(good?" success":""); };
const configured = !firebaseConfig.apiKey.startsWith("PASTE_");
let auth, db, storage, currentUser, stopFeed, stopMessages, currentChatId;

if (!configured) notice("Firebase setup required. Follow README.txt, then paste your Firebase web config into app.js.");
else {
  const app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app); storage=getStorage(app);
}

function showTab(tab) {
  ["feed","create","chat","wallet","profile"].forEach(t => $(t+"Tab").classList.toggle("hidden",t!==tab));
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
function money(n){return new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format((n||0)/100);}

$("signupBtn").onclick=async()=>{
  if(!configured)return notice("Complete Firebase setup first.");
  try{
    const name=$("name").value.trim(), email=$("email").value.trim(), password=$("password").value;
    if(!name) throw Error("Enter your name.");
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    await updateProfile(cred.user,{displayName:name});
    await setDoc(doc(db,"users",cred.user.uid),{displayName:name,email,createdAt:serverTimestamp(),balanceKobo:0});
    notice("Account created. Welcome to TACN Connect!",true);
  }catch(e){notice(e.message);}
};
$("loginBtn").onclick=async()=>{
  if(!configured)return notice("Complete Firebase setup first.");
  try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);}
  catch(e){notice(e.message);}
};
$("logoutBtn").onclick=()=>signOut(auth);

if(configured) onAuthStateChanged(auth,async user=>{
  currentUser=user;
  $("authCard").classList.toggle("hidden",!!user); $("app").classList.toggle("hidden",!user);
  if(!user){if(stopFeed)stopFeed();if(stopMessages)stopMessages();return;}
  const uref=doc(db,"users",user.uid), usnap=await getDoc(uref);
  if(!usnap.exists()) await setDoc(uref,{displayName:user.displayName||"Member",email:user.email,createdAt:serverTimestamp(),balanceKobo:0});
  const u=(await getDoc(uref)).data();
  $("hello").textContent="Hello, "+(u.displayName||user.displayName||"Member");
  $("myEmail").textContent=user.email||""; $("profileName").textContent=u.displayName||user.displayName||"Member";
  $("profileUid").value=user.uid;
  watchFeed(); watchWallet();
});

function watchFeed(){
  if(stopFeed)stopFeed();
  const q=query(collection(db,"posts"),orderBy("createdAt","desc"),limit(40));
  stopFeed=onSnapshot(q,snap=>{
    $("feed").innerHTML="";
    if(snap.empty){$("feed").innerHTML='<p class="muted">No posts yet. Be the first to share something.</p>';return;}
    snap.forEach(d=>renderPost(d.id,d.data()));
  },e=>notice("Feed error: "+e.message));
}
function renderPost(id,p){
  const el=document.createElement("article");el.className="post";
  const name=document.createElement("b");name.textContent=p.authorName||"Member";
  const time=document.createElement("div");time.className="muted small";time.textContent=p.createdAt?.toDate?.().toLocaleString()||"Just now";
  const cap=document.createElement("div");cap.className="caption";cap.textContent=p.caption||"";
  el.append(name,time,cap);
  if(p.mediaUrl){
    const media=document.createElement(p.mediaType==="video"?"video":"img");
    media.src=p.mediaUrl;if(media.tagName==="VIDEO"){media.controls=true;media.playsInline=true;}else media.alt="Post image";
    el.append(media);
  }
  const actions=document.createElement("div");actions.className="row";
  const like=document.createElement("button");like.className="secondary";like.textContent="Like";
  like.onclick=async()=>{try{const lref=doc(db,"posts",id,"likes",currentUser.uid);const ls=await getDoc(lref);if(ls.exists())return;await setDoc(lref,{uid:currentUser.uid,createdAt:serverTimestamp()});}catch(e){notice(e.message);}};
  const comment=document.createElement("button");comment.className="secondary";comment.textContent="Comment";
  const cinput=document.createElement("input");cinput.placeholder="Write a comment…";
  const cbtn=document.createElement("button");cbtn.textContent="Send";
  cbtn.onclick=async()=>{const t=cinput.value.trim();if(!t)return;try{await addDoc(collection(db,"posts",id,"comments"),{uid:currentUser.uid,authorName:currentUser.displayName||"Member",text:t,createdAt:serverTimestamp()});cinput.value="";}catch(e){notice(e.message);}};
  const del=document.createElement("button");del.className="danger";del.textContent="Delete";
  del.onclick=async()=>{notice("Post deletion is not enabled in this starter. Ask the administrator to remove content.");};
  actions.append(like,comment);el.append(actions,cinput,cbtn);
  const count=document.createElement("div");count.className="muted small";el.append(count);
  onSnapshot(collection(db,"posts",id,"likes"),s=>count.textContent=s.size+" likes");
  const comments=document.createElement("div");comments.className="muted small";
  onSnapshot(query(collection(db,"posts",id,"comments"),orderBy("createdAt","asc"),limit(10)),s=>{
    comments.innerHTML="";s.forEach(c=>{const line=document.createElement("p");line.textContent=(c.data().authorName||"Member")+": "+c.data().text;comments.append(line);});
  });
  el.append(comments);$("feed").append(el);
}

$("publishBtn").onclick=async()=>{
  if(!currentUser)return;
  const caption=$("caption").value.trim(), file=$("mediaFile").files[0];
  if(!caption&&!file)return notice("Write something or choose a picture/video.");
  if(file && file.size>50*1024*1024)return notice("File is larger than 50 MB. Choose a smaller file.");
  $("publishBtn").disabled=true;
  try{
    let mediaUrl="",mediaType="";
    if(file){
      if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))throw Error("Choose an image or video file.");
      const path=`posts/${currentUser.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
      const uploaded=await uploadBytes(ref(storage,path),file);mediaUrl=await getDownloadURL(uploaded.ref);
      mediaType=file.type.startsWith("video/")?"video":"image";
    }
    await addDoc(collection(db,"posts"),{uid:currentUser.uid,authorName:currentUser.displayName||"Member",caption,mediaUrl,mediaType,createdAt:serverTimestamp()});
    $("caption").value="";$("mediaFile").value="";showTab("feed");notice("Your post has been published.",true);
  }catch(e){notice("Could not publish: "+e.message);}
  finally{$("publishBtn").disabled=false;}
};

function chatId(a,b){return [a,b].sort().join("_");}
$("openChatBtn").onclick=async()=>{
  const other=$("chatUid").value.trim();
  if(!other||other===currentUser.uid)return notice("Enter another member's User ID.");
  try{
    const otherDoc=await getDoc(doc(db,"users",other));if(!otherDoc.exists())return notice("No member found with that User ID.");
    currentChatId=chatId(currentUser.uid,other);
    await setDoc(doc(db,"chats",currentChatId),{members:[currentUser.uid,other],updatedAt:serverTimestamp()},{merge:true});
    $("chatArea").classList.remove("hidden");$("chatWith").textContent="Chat with "+(otherDoc.data().displayName||"Member");
    if(stopMessages)stopMessages();
    stopMessages=onSnapshot(query(collection(db,"chats",currentChatId,"messages"),orderBy("createdAt","asc"),limit(100)),s=>{
      $("messages").innerHTML="";
      s.forEach(d=>{const m=d.data(),bubble=document.createElement("div");bubble.className="msg"+(m.uid===currentUser.uid?" mine":"");bubble.textContent=m.text;$("messages").append(bubble);});
      $("messages").scrollTop=$("messages").scrollHeight;
    });
  }catch(e){notice(e.message);}
};
$("sendBtn").onclick=async()=>{
  const text=$("messageText").value.trim();if(!text||!currentChatId)return;
  try{await addDoc(collection(db,"chats",currentChatId,"messages"),{uid:currentUser.uid,text,createdAt:serverTimestamp()});await setDoc(doc(db,"chats",currentChatId),{updatedAt:serverTimestamp()},{merge:true});$("messageText").value="";}
  catch(e){notice(e.message);}
};
$("messageText").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendBtn").click();});

function watchWallet(){
  onSnapshot(doc(db,"users",currentUser.uid),s=>{$("balance").textContent=money(s.data()?.balanceKobo||0);});
  onSnapshot(query(collection(db,"users",currentUser.uid,"earnings"),orderBy("createdAt","desc"),limit(20)),s=>{
    $("earnings").innerHTML="";if(s.empty){$("earnings").textContent="No earnings recorded yet.";return;}
    s.forEach(d=>{const x=d.data(),p=document.createElement("p");p.textContent=`${money(x.amountKobo)} — ${x.description||"Creator revenue share"}`;$("earnings").append(p);});
  });
}
$("withdrawBtn").onclick=async()=>{
  const amount=Number($("withdrawAmount").value),details=$("withdrawDetails").value.trim();
  if(!Number.isInteger(amount)||amount<100)return notice("Enter a whole amount of at least ₦100.");
  if(!details)return notice("Enter your bank name and account number.");
  try{
    await addDoc(collection(db,"withdrawalRequests"),{uid:currentUser.uid,amountKobo:amount*100,paymentDetails:details,status:"pending",createdAt:serverTimestamp()});
    $("withdrawAmount").value="";$("withdrawDetails").value="";notice("Withdrawal request submitted for review.",true);
  }catch(e){notice("Could not submit request: "+e.message);}
};
$("copyUidBtn").onclick=async()=>{try{await navigator.clipboard.writeText(currentUser.uid);notice("User ID copied.",true);}catch{notice("Select and copy the User ID from the box.");}};
