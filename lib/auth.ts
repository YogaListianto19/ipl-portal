import jwt from 'jsonwebtoken'
import { JWTPayload, Role } from './types'

const SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'ipl_token'
const EXPIRES_IN = '24h'

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload
  } catch {
    return null
  }
}

export const COOKIE = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  },
}

export const ADMIN_ROLES: Role[] = ['admin', 'treasurer', 'chairman']

export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role)
}

export function roleLabel(role: Role): string {
  const map: Record<Role, string> = {
    resident: 'Warga',
    admin: 'Admin',
    treasurer: 'Bendahara',
    chairman: 'Ketua',
  }
  return map[role]
}
