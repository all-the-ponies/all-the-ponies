export default function absoluteUrl(path: string) {
    let domain = __BASE_URL__
    try {
        domain = location.origin
    } catch {
        domain = __BASE_URL__
    }
    
    return String(new URL(path, domain))
}
