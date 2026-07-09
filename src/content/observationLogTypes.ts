export type StaticMissionCard = {
  id: string
  title: string
  tagline: string
  kind: 'static'
  paragraphs: string[]
}

export type LiveReadoutMissionCard = {
  id: string
  title: string
  tagline: string
  kind: 'live-readout'
}

export type TeaserMissionCard = {
  id: string
  title: string
  tagline: string
  kind: 'teaser'
  paragraphs: string[]
}

export type MissionCardDefinition =
  | StaticMissionCard
  | LiveReadoutMissionCard
  | TeaserMissionCard

export type MissionConsoleContent = {
  collapsedHint: string
  collapsedSubhint: string
  cards: MissionCardDefinition[]
}
