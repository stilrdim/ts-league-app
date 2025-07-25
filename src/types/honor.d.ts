export interface Ballot {
  eligibleAllies: BallotPlayer[];
  eligibleOpponents: BallotPlayer[];
  gameId: number;
  honoredPlayers: HonoredPlayers[] | [];
  votePool: VotePool;
}

export interface BallotPlayer {
  botPlayer: boolean;
  championName: string;
  puuid: string;
  role: string;
  skinSplashPath: string;
  summonerId: number;
  summonerName: string; // Usually empty
}

export interface VotePool {
  fromGamePlayed: number;
  fromHighHonor: number;
  fromRecentHonors: number;
  fromRollover: number;
  votes: number; // Total available votes
}

export interface HonoredPlayers {
  honorType: "HEART";
  recipientPuuid: string;
}

export interface HonorRequestBody {
  recipientPuuid: string;
  honorType: HonorType;
}

export type HonorType = "STAYED_COOL" | "GREAT_SHOT_CALLING" | "HEART";
