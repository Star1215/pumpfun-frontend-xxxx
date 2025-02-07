import { axiosPrivate } from "../axiosPrivate"
import { axiosPublic } from "../axiosPublic"
import { retryFunction } from "../../utils/retry"

export async function uploadMetadata(logoFile, metadata) {
  return await retryFunction(async () => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('metadata', metadata);
    console.log('debug->formData1', formData)
    let datas;
    await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/token/upload_metadata', {
      method: 'POST',
      body: formData
    }).then(async res => {
      datas = await res.json()
      console.log('debug->datas', datas, datas.metadataUri)
      const { imageUrl, metadataUri } = datas;
      console.log('debug->imageUrl', imageUrl, metadataUri)
      return { imageUrl, metadataUri };
    });
  });
}

export async function updateToken(name, ticker, desc, logo, twitter, telegram, website, mintAddr) {
  return await retryFunction(async () => {
    const result = await axiosPrivate.post(`/token/update_token`, {
      name, ticker, desc, logo, twitter, telegram, website, mintAddr
    });
    return result.data;
  });
}

export async function findTokens(name, sort_condition, sort_order, nsfw) {
  return await retryFunction(async () => {
    const result = await axiosPublic.get(`/token/find_tokens?name=${name}&sort_condition=${sort_condition.replace('sort: ', '')}&sort_order=${sort_order.replace('sort: ', '')}&include_nsfw=${nsfw}`)
    return result.data;
  });
}

export async function getKing() {
  return await retryFunction(async () => {
    const result = await axiosPublic.get('/token/get_king_of_the_hill')
    return result.data;
  });
}

export async function getToken(mintAddr, userId) {
  return await retryFunction(async () => {
    const userIdStr = encodeURIComponent(JSON.stringify(userId))
    const result = await axiosPublic.get(`/token/get_token_info?mintAddr=${mintAddr}&userId=${userIdStr}`)
    return result.data;
  });
}

export async function getThreadData(mintAddr, userId) {
  return await retryFunction(async () => {
    const userIdStr = encodeURIComponent(JSON.stringify(userId))
    const result = await axiosPublic.get(`/token/get_thread_data?mintAddr=${mintAddr}&userId=${userIdStr}`)
    return result.data;
  });
}

export async function reply(mintAddr, comment, imageFile) {
  return await retryFunction(async () => {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('mintAddr', mintAddr)
    formData.append('comment', comment)

    const result = await axiosPrivate.post('/token/reply', formData)
    return result;
  });
}

export async function likeReply(replyMentionId) {
  return await retryFunction(async () => {
    const result = await axiosPrivate.post('/token/reply_like', { replyMentionId })
    return result;
  });
}

export async function dislikeReply(replyMentionId) {
  return await retryFunction(async () => {
    const result = await axiosPrivate.post('/token/reply_dislike', { replyMentionId })
    return result;
  });
}

export async function mentionReply(replyMentionId, message, imageFile) {
  return await retryFunction(async () => {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('replyMentionId', replyMentionId)
    formData.append('message', message)

    const result = await axiosPrivate.post('/token/reply_mention', formData)
    return result;
  });
}

export async function trade(mintAddr, isBuy, baseAmount, quoteAmount, txhash, comment) {
  return await retryFunction(async () => {
    const result = await axiosPrivate.post(`/token/trade`, {
      mintAddr, isBuy, baseAmount, quoteAmount, txhash, comment
    });
    return result.data;
  });
}

export async function getTradeHistory(mintAddr) {
  return await retryFunction(async () => {
    const result = await axiosPublic.get(`/token/get_trade_hist?mintAddr=${mintAddr}`)
    return result.data;
  });
}

export async function getMarketId(baseMint, quoteMint) {
  return await retryFunction(async () => {
    const result = await axiosPublic.get(`/token/get_marketid?baseMint=${baseMint}&quoteMint=${quoteMint}`)
    return result.data;
  });
}
