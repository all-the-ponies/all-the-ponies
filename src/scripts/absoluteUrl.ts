export default function absoluteUrl(path: string) {
    let domain = __BASE_URL__
    try {
        domain = location.origin
    } catch {
        domain = __BASE_URL__
    }

    if (!path.endsWith('/')) {
        path += '/'
    }
    
    return String(new URL(path, domain))
}
