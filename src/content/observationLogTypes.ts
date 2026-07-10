export type MissionCardIcon =
  | 'brief'
  | 'seeing'
  | 'discovery'
  | 'special'
  | 'experiment'

export type StaticMissionCard = {
  id: string
  title: string
  icon: MissionCardIcon
  kind: 'static'
  lines: string[]
}

export type DynamicMissionCard = {
  id: string
  title: string
  icon: MissionCardIcon
  kind: 'discovery'
}

export type MissionCardDefinition = StaticMissionCard | DynamicMissionCard

export type MissionConsoleContent = {
  missionName: string
  status: string
  collapsedTeaser: string
  cards: MissionCardDefinition[]
}
