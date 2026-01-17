export default function absoluteUrl(path: string) {
    return String(new URL(path, 'https://all-the-ponies.vercel.app'))
}
