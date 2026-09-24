import elysianClient from '@/api/elysianClient'

export const accessItemService = {
    getUserAccessItems,
    createLinkToken,
    setAccessToken,
    createLinkTokenForUpdate,
    getUserAccessItem
};

export default accessItemService

async function getUserAccessItems() {
    return await elysianClient.getData(`/api/GetUserAccessItems`)
}

async function getUserAccessItem(userAccessItemId: number) {
    return await elysianClient.getData(`/api/GetUserAccessItem?userAccessItemId=${userAccessItemId}`)
}

async function createLinkToken () {
    return await elysianClient.postData(`/api/CreateFinancialLinkToken`, {})
}

async function createLinkTokenForUpdate (accessToken: string) {
    return await elysianClient.postData(`/api/CreateFinancialLinkToken?accessToken=${accessToken}`, {})
}

async function setAccessToken (publicToken: string) {
    return await elysianClient.postData(`/api/SetInstitutionAccessToken`, { public_token: publicToken })
}