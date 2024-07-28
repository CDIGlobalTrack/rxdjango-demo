# RxDjango Tutorial Step 1: Setup RxDjango

Now that we have setup a basic Django + React application, let's setup RxDjango.

## Install dependencies

RxDjango depends on Redis and MongoDB. Redis is used as a broker and MongoDB as cache.
As it's in alpha stage, only these engines are supported.

   ```bash
   sudo apt-get install redis-server mongodb-org-server
   ```

## Install and configure RxDjango

Go to the `backend/` folder of the rxdjango-demo project and install RxDjango.

   ```bash
   pip install rxdjango
   ```

This will also install `daphne` and `channels`.

## Modify settings

Add `rxdjango` and `daphne` to the list of installed apps. Make sure they're declared in this order,
and come before `django.contrib.staticfiles`. You'll also need to add `channels`.

   ```python
   INSTALLED_APPS = [
       # rxdjango must come before daphne, and both before contrib.staticfiles

       'rxdjango',
       'daphne',
       'django.contrib.staticfiles',

       # these can come anywhere
       'channels',
   ]
   ```

Set the ASGI_APPLICATION variable

   ```python
   ASGI_APPLICATION = 'backend.asgi.application'
   ```

Configure access to Redis

   ```python
   REDIS_URL = f'redis://127.0.0.1:6379/0'
   ```

Configure MongoDB.

   ```python
   MONGO_URL = 'mongodb://localhost:27017/'
   MONGO_STATE_DB = 'hot_state'
   ```
