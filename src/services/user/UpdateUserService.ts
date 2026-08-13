import prismaClient from "../../prisma"; 

interface UserRequest{
    user_id: string;
    name: string;
    email: string;
}



class UpdateUserService {
    async execute({user_id, name, email}:UserRequest) { 

        try{ 
            const userAlreadyExists = await prismaClient.user.findFirst({ 
                where: { 
                    id: user_id,
                }
            }); 

            if(!userAlreadyExists) { 
                throw new Error("Usuário não encontrado"); 
            } 

            const userUpdated = await prismaClient.user.update({ 
                where: { 
                    id: user_id,
                },
                data:{
                    name: name,
                    email: email,
                },
                select: {                  
                    name: true,
                    email: true,
                }
            
            }); 
            
            return userUpdated;
            
        } catch (error) {
            console.log(error);
            throw new Error("Erro ao atualizar usuário");
        }

       
    }
}

export { UpdateUserService }