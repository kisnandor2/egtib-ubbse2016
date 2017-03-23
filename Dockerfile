FROM node

COPY package.json /egtib/
WORKDIR /egtib
RUN npm install --production
COPY . /egtib/

CMD ["/egtib/start.sh"]
ENTRYPOINT ["bash"]