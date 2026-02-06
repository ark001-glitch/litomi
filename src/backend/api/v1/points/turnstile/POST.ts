import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

// 이 부분은 쿠키를 만드는 도구라 지우면 안 됩니다.
import { POINTS_TURNSTILE_TTL_SECONDS, signPointsTurnstileToken } from '../util-turnstile-cookie'

export type POSTV1PointTurnstileResponse = { verified: true; expiresInSeconds: number }

const route = new Hono<Env>()

// 검사 로직(Validator)은 싹 다 제거했습니다.

route.post('/', requireAuth, async (c) => {
  // 사용자가 누군지는 알아야 쿠키를 구워주니 userId는 가져옵니다.
  const userId = c.get('userId')!

  // --- [삭제됨] Turnstile 검사 로직 ---
  // 원래 여기에 있던 "너 사람 맞아?" 하고 물어보는 코드를 다 없앴습니다.
  // 이제 무조건 통과입니다.

  // --- [유지됨] 프리패스권(쿠키) 발급 ---
  // 이 부분이 중요합니다. 이게 있어야 다음 단계(포인트 적립 등)가 작동합니다.
  const signedCookie = await signPointsTurnstileToken(userId)

  setCookie(c, CookieKey.POINTS_TURNSTILE, signedCookie, {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    maxAge: POINTS_TURNSTILE_TTL_SECONDS,
    path: '/api/v1/points',
    sameSite: 'strict',
    secure: true,
  })

  // 성공했다고 프론트엔드에 알려줍니다.
  return c.json<POSTV1PointTurnstileResponse>({
    verified: true,
    expiresInSeconds: POINTS_TURNSTILE_TTL_SECONDS,
  })
})

export default route
