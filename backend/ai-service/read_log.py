import os
try:
    if os.path.exists('error.log'):
        with open('error.log', 'r') as f:
            print(f.read())
    else:
        print("error.log not found")
except Exception as e:
    print(f"Error: {e}")
