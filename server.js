from telethon import TelegramClient
import os

# Replace these with your own API ID and Hash
api_id = 'YOUR_API_ID'
api_hash = 'YOUR_API_HASH'
channel_username = 'CHANNEL_USERNAME'  # Without @ symbol
download_folder = 'downloads'

# Create downloads folder if it doesn't exist
if not os.path.exists(download_folder):
    os.makedirs(download_folder)

# Initialize Telegram Client
client = TelegramClient('session_name', api_id, api_hash)

async def download_zip_files():
    await client.start()
    print("Client Created and Logged In!")

    # Get the target channel
    channel = await client.get_entity(channel_username)

    # Iterate through messages and download ZIP files
    async for message in client.iter_messages(channel):
        if message.file and message.file.name.endswith('.zip'):
            file_path = os.path.join(download_folder, message.file.name)
            if not os.path.exists(file_path):  # Avoid duplicates
                await message.download_media(file=file_path)
                print(f'Downloaded: {message.file.name}')

with client:
    client.loop.run_until_complete(download_zip_files())
