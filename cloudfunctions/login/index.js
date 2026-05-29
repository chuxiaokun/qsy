const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const USERS = "users"
const COUNTER_ID = "user_public_id"
const PUBLIC_ID_START = 10001

async function nextPublicId() {
  const counterRef = db.collection("counters").doc(COUNTER_ID)
  let doc
  try {
    doc = await counterRef.get()
  } catch {
    doc = { data: null }
  }
  if (!doc.data || typeof doc.data.seq !== "number") {
    await counterRef.set({ data: { seq: PUBLIC_ID_START } })
    return PUBLIC_ID_START
  }
  const next = doc.data.seq + 1
  await counterRef.update({ data: { seq: _.inc(1) } })
  return next
}

function buildNickname(publicId) {
  return `用户${String(publicId).slice(-4)}`
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 500, msg: "无法获取用户身份" }
  }

  const users = db.collection(USERS)
  const existing = await users.where({ _openid: OPENID }).limit(1).get()

  let doc
  if (existing.data.length) {
    doc = existing.data[0]
    await users.doc(doc._id).update({
      data: { lastLoginAt: db.serverDate() }
    })
  } else {
    const publicId = await nextPublicId()
    const addRes = await users.add({
      data: {
        publicId,
        nickname: buildNickname(publicId),
        avatarUrl: "",
        email: "",
        emailVerified: false,
        createdAt: db.serverDate(),
        lastLoginAt: db.serverDate()
      }
    })
    const created = await users.doc(addRes._id).get()
    doc = created.data
    doc._id = addRes._id
  }

  return {
    code: 200,
    data: {
      token: OPENID,
      user: {
        id: doc._id,
        openid: OPENID,
        publicId: doc.publicId,
        nickname: doc.nickname || buildNickname(doc.publicId),
        avatarUrl: doc.avatarUrl || "",
        email: doc.email || "",
        emailVerified: !!doc.emailVerified,
        isGuest: false
      }
    }
  }
}
