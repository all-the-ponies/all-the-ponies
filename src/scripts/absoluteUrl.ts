export default function absoluteUrl(path: string) {
    let domain = __BASE_URL__
    try {
        domain = location.origin
    } catch {
        domain = __BASE_URL__
    }

    // DO NOT NORMALIZE END SLASH, IT BREAKS IMAGE URLS
    
    return String(new URL(path, domain))
}
