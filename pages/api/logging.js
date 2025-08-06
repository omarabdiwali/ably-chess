export default function handler(req, res) {
    if (req.method === 'POST') {
        console.log('LOGGER', req.body.message); // Log to server terminal
        res.status(200).json({ message: 'Log received' });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}