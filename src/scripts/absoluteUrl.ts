export default function absoluteUrl(path: string) {
    let domain = 'https://all-the-ponies.com'
    try {
        domain = location.origin
    } catch {
        domain = process?.env?.VERCEL_URL || 'https://all-the-ponies.com'
    }
    
    return String(new URL(path, domain))
}
