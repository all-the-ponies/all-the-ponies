export function makeOg(url: string) {
    const urlObj = new URL(url)
    urlObj.searchParams.set('transform', 'og')
    return urlObj.toString()
}
