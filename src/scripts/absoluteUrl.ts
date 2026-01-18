export default function absoluteUrl(path: string) {
    let domain = 'https://all-the-ponies.com'
    try {
        domain = location.origin
    } catch {
        domain = 'https://all-the-ponies.com'
    }
    
    return String(new URL(path, domain))
}
