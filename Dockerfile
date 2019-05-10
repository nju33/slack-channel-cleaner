FROM node:10

MAINTAINER nju33

WORKDIR /usr/src/app

COPY . .
RUN yarn --production && yarn link

ENTRYPOINT [ "/bin/bash" ]


