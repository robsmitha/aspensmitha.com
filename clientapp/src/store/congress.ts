// Utilities
import { defineStore } from 'pinia'

type State = {
  trackedBills: any | undefined
}

export const useCongressStore = defineStore('congress', {
  state: (): State => ({
    trackedBills: undefined
  }),
  getters: {
    hasTrackedBills: (state: State) => state.trackedBills !== undefined
  },
  actions: {
    // async fetchTrackedBills(): Promise<void> {
    //   const response = await fetch('/api/CongressGetBills')
    //   if (!response.ok){
    //     console.error("Failed to get bills.")
    //     return
    //   }
    //   const data = await response.json()
    //   this.bills = data.bills
    //   console.log(this.bills)
    // },
    // async trackBill(billId: string, congress: string): Promise<void> {
    //   const response = await fetch('/api/CongressTrackBill', {
    //       method: 'post',
    //       headers: {
    //           'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({ billId, congress })
    //   })

    //   if(!response.ok){
    //     // TODO: deserialize json response for 400 errors
    //     throw new Error("Could not get github access token")
    //   }

    //   const data = await response.json()
    //   // TODO: update trackedBills
    // }
  }
})