import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'app'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#0a0a0a',
				color: 'white',
				fontSize: 64,
				fontWeight: 700
			}}
		>
			<div>app</div>
			<div
				style={{ fontSize: 32, fontWeight: 400, opacity: 0.7, marginTop: 16 }}
			>
				Your tagline here
			</div>
		</div>,
		{ ...size }
	)
}
