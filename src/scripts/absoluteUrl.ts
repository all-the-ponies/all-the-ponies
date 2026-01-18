export default function absoluteUrl(path: string) {
    let domain = 'https://all-the-ponies.com'
    try {
        domain = location.origin
    } catch {
        console.log('vercel url', process?.env?.VERCEL_URL)
        domain = 'https://all-the-ponies.com'
    }
    
    return String(new URL(path, domain))
}
