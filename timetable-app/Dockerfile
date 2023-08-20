FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g @vue/cli

# RUN vue create --default --force .

# RUN vue add vuetify

# CMD [ "npm", "run", "serve" ]
