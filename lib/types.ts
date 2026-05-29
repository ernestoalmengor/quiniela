export interface Team {
  id?: string
  name: string
  shortName: string
  logo: string
}

export interface Score {
  home: number
  away: number
}

export interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  date: string
  venue: string
  status: "upcoming" | "live" | "finished"
  score: Score | null
  minute?: number
}

export interface Jornada {
  id: number
  name: string
  status: "upcoming" | "live" | "finished" | "hidden"
  deadline: string
  phase?: { id: string; name: string }
  matches: Match[]
}

export interface Prediction {
  home: number
  away: number
}

export interface Participant {
  id: string
  name: string
  avatar: string
  totalPoints: number
  predictions: Record<string, Prediction>
}

export interface Rules {
  exactScore: number
  correctResult: number
  correctGoalDifference: number
  description: string
}

export interface Tournament {
  name: string
  season: string
  logo: string
}

export interface CurrentUser {
  name: string
  avatar: string
  participantId: string
  username?: string
  isAdmin?: boolean
}

export interface TeamStats {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface Group {
  id: string
  name: string
  teams: TeamStats[]
}

export interface KnockoutMatch {
  id: string
  phase: string 
  homeTeam: Team | null
  awayTeam: Team | null
  date: string
  status: "upcoming" | "live" | "finished"
  score: Score | null
  homePenalties?: number
  awayPenalties?: number
  winnerTo?: string
}

export interface UserGroupMember {
  id: string
  name: string
  avatar: string
  points: number
  predictions: Record<string, Prediction>
}

export interface UserGroup {
  id: string
  name: string
  inviteCode: string
  adminId: string
  members: UserGroupMember[]
}

export interface AdminData {
  users: any[]
  teams: any[]
  matches: any[]
  jornadas: any[]
  phases: any[]
  systemConfig: any
  groups: any[]
}

export interface QuinielaData {
  currentUser: CurrentUser
  tournament: Tournament
  jornadas: Jornada[]
  groups?: Group[]
  bracket?: KnockoutMatch[]
  participants: Participant[]
  userGroups?: UserGroup[]
  rules: Rules
  adminData?: AdminData
}
